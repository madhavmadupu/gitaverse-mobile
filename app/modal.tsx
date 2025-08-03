import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../utils/api';
import { hapticsService } from '../utils/haptics';
import { Chapter, VerseWithChapter, Verse } from '../types';
import VerseCard from '../components/VerseCard';

type ModalType = 'chapter' | 'verse' | 'search';

export default function Modal() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<VerseWithChapter[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<VerseWithChapter | null>(null);

  useEffect(() => {
    const loadModalContent = async () => {
      try {
        setLoading(true);

        const type = Array.isArray(params.type) ? params.type[0] : params.type;
        const chapterId = Array.isArray(params.chapterId) ? params.chapterId[0] : params.chapterId;
        const verseId = Array.isArray(params.verseId) ? params.verseId[0] : params.verseId;

        console.log('Modal params:', { type, chapterId, verseId });

        if (type === 'chapter' && chapterId) {
          await loadChapterContent(chapterId);
        } else if (type === 'verse' && verseId) {
          await loadVerseContent(verseId);
        } else {
          console.log('No valid params found, setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading modal content:', error);
        setLoading(false);
      }
    };

    // Only run if we have valid params
    const type = Array.isArray(params.type) ? params.type[0] : params.type;
    const chapterId = Array.isArray(params.chapterId) ? params.chapterId[0] : params.chapterId;
    const verseId = Array.isArray(params.verseId) ? params.verseId[0] : params.verseId;

    if (type && (chapterId || verseId)) {
      loadModalContent();
    } else {
      console.log('No valid params, skipping load');
      setLoading(false);
    }
  }, [params.type, params.chapterId, params.verseId]);

  const loadChapterContent = async (chapterId: string) => {
    try {
      console.log('Loading chapter content for chapterId:', chapterId);
      
      // Get chapter details
      const chapters = await apiService.getChapters();
      console.log('Retrieved chapters:', chapters.length);
      
      const chapterNumber = parseInt(chapterId);
      console.log('Looking for chapter number:', chapterNumber);
      
      const chapterData = chapters.find(c => c.chapter_number === chapterNumber);
      console.log('Found chapter data:', chapterData ? 'yes' : 'no');

      if (chapterData) {
        setChapter(chapterData);

        // Get verses for this chapter
        const chapterVerses = await apiService.getVersesByChapter(chapterNumber);
        console.log('Retrieved verses:', chapterVerses?.length || 0);

        if (chapterVerses && Array.isArray(chapterVerses)) {
          // Load user progress for these verses
          const versesWithProgress = await loadVersesWithProgress(chapterVerses, chapterData);
          setVerses(versesWithProgress);
        }
      } else {
        console.log('Chapter not found:', chapterId);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading chapter content:', error);
      setLoading(false);
    }
  };

  const loadVersesWithProgress = async (verses: Verse[], chapterData: Chapter): Promise<VerseWithChapter[]> => {
    try {
      // Get user progress for all verses
      const userProgress = await apiService.getUserProgress();
      
      return verses.map(verse => ({
        ...verse,
        chapter: chapterData,
        isCompleted: userProgress.completedVerses.includes(verse.id),
        isFavorite: userProgress.favoriteVerses.includes(verse.id),
      }));
    } catch (error) {
      console.error('Error loading verses with progress:', error);
      // Fallback to default values
      return verses.map(verse => ({
        ...verse,
        chapter: chapterData,
        isCompleted: false,
        isFavorite: false,
      }));
    }
  };

  const loadVerseContent = async (verseId: string) => {
    try {
      console.log('Loading verse content for verseId:', verseId);
      
      const verse = await apiService.getVerse(verseId);
      console.log('Retrieved verse:', verse ? 'yes' : 'no');
      
      if (verse) {
        // Get chapter for this verse
        const chapters = await apiService.getChapters();
        const chapterData = chapters.find(c => c.id === verse.chapter_id);

        if (chapterData) {
          // Load all verses for this chapter to enable navigation
          const chapterVerses = await apiService.getVersesByChapter(chapterData.chapter_number);
          console.log('Loaded chapter verses for navigation:', chapterVerses?.length || 0);

          if (chapterVerses && Array.isArray(chapterVerses)) {
            const versesWithProgress = await loadVersesWithProgress(chapterVerses, chapterData);
            setVerses(versesWithProgress);
          }
        }

        // Find the verse with progress from the loaded verses
        const verseWithProgress = verses.find(v => v.id === verseId);
        
        if (verseWithProgress) {
          setSelectedVerse(verseWithProgress);
        } else {
          // Fallback if verse not found in loaded verses
          const verseWithChapter: VerseWithChapter = {
            ...verse,
            chapter: chapterData || undefined,
            isCompleted: false,
            isFavorite: false,
          };
          setSelectedVerse(verseWithChapter);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading verse content:', error);
      setLoading(false);
    }
  };

  const handleClose = () => {
    hapticsService.buttonPress();
    router.back();
  };

  const handleVersePress = (verse: VerseWithChapter) => {
    hapticsService.selection();
    // Navigate to verse modal
    router.push(`/modal?type=verse&verseId=${verse.id}`);
  };

  const handleMarkAsRead = async (verseId: string) => {
    try {
      await apiService.markVerseAsRead(verseId, 60); // 60 seconds
      hapticsService.success();

      // Update the verse in the list
      setVerses(prev => prev.map(v =>
        v.id === verseId ? { ...v, isCompleted: true } : v
      ));

      if (selectedVerse?.id === verseId) {
        setSelectedVerse(prev => prev ? { ...prev, isCompleted: true } : null);
      }

      // Refresh chapter progress if we're in chapter view
      if (chapter) {
        const updatedVerses = await loadVersesWithProgress(
          verses.map(v => ({ ...v, chapter: undefined, isCompleted: false, isFavorite: false })),
          chapter
        );
        setVerses(updatedVerses);
      }
    } catch (error) {
      console.error('Error marking verse as read:', error);
      hapticsService.errorAction();
    }
  };

  const handleFavorite = async (verseId: string) => {
    try {
      hapticsService.selection();
      // Update the verse in the list
      setVerses(prev => prev.map(v =>
        v.id === verseId ? { ...v, isFavorite: !v.isFavorite } : v
      ));

      if (selectedVerse?.id === verseId) {
        setSelectedVerse(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      hapticsService.errorAction();
    }
  };

    const handleShare = async (verse: VerseWithChapter) => {
    try {
      await hapticsService.buttonPress();
      const shareText = `Bhagavad Gita Chapter ${verse.chapter?.chapter_number} • Verse ${verse.verse_number}\n\n${verse.sanskrit_text}\n\n${verse.english_translation}\n\nExplore this verse in Gitaverse - your daily spiritual companion! 📖✨\n\n#BhagavadGita #Chapter${verse.chapter?.chapter_number}`;
      
      // For now, just log the share text
      console.log('Share text:', shareText);
    } catch (error) {
      console.error('Error sharing verse:', error);
      hapticsService.errorAction();
    }
  };

  const handlePreviousVerse = () => {
    if (!selectedVerse || !verses.length) return;
    
    const currentIndex = verses.findIndex(v => v.id === selectedVerse.id);
    if (currentIndex > 0) {
      const previousVerse = verses[currentIndex - 1];
      router.replace(`/modal?type=verse&verseId=${previousVerse.id}`);
    }
  };

  const handleNextVerse = () => {
    if (!selectedVerse || !verses.length) return;
    
    const currentIndex = verses.findIndex(v => v.id === selectedVerse.id);
    if (currentIndex < verses.length - 1) {
      const nextVerse = verses[currentIndex + 1];
      router.replace(`/modal?type=verse&verseId=${nextVerse.id}`);
    }
  };

  const renderChapterContent = () => (
    <View className="flex-1">
      {/* Chapter Header */}
      <View className="bg-white px-6 py-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={handleClose} className="p-2">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2">
            <Ionicons name="bookmark-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Chapter {chapter?.chapter_number}: {chapter?.title_english}
        </Text>
        <Text className="text-lg text-orange-600 mb-2 font-sanskrit">
          {chapter?.title_sanskrit}
        </Text>
        <Text className="text-gray-600 mb-4">
          {chapter?.description}
        </Text>

        {/* Progress Summary */}
        {verses.length > 0 && (
          <View className="bg-orange-50 rounded-lg p-3 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="book-outline" size={16} color="#F97316" />
                <Text className="text-sm text-gray-700 ml-2">
                  {verses.filter(v => v.isCompleted).length} of {verses.length} verses completed
                </Text>
              </View>
              <View className="bg-orange-100 px-2 py-1 rounded-full">
                <Text className="text-xs font-medium text-orange-700">
                  {Math.round((verses.filter(v => v.isCompleted).length / verses.length) * 100)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-500">
            {verses.length} verses
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-500 ml-1">
              ~{Math.round(verses.length * 2)} min read
            </Text>
          </View>
        </View>
      </View>

      {/* Verses List */}
      <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
        <View className="px-2 py-2">
          {verses.map((verse, index) => (
            <TouchableOpacity
              key={verse.id}
              onPress={() => handleVersePress(verse)}
              className="bg-white rounded-xl p-4 mb-2 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-800">
                  Verse {verse.verse_number}
                </Text>
                <View className="flex-row items-center">
                  {verse.isCompleted && (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  )}
                  {verse.isFavorite && (
                    <Ionicons name="heart" size={20} color="#EF4444" className="ml-2" />
                  )}
                </View>
              </View>

              <Text className="text-base text-gray-700 leading-6 mb-3" numberOfLines={2}>
                {verse.english_translation}
              </Text>

              <Text className="text-sm text-orange-600 font-sanskrit" numberOfLines={1}>
                {verse.sanskrit_text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

    const renderVerseContent = () => {
    if (!selectedVerse) return null;
    
    return (
      <View className="flex-1">
        {/* Verse Header */}
        <View className="bg-white px-6 py-6 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={handleClose} className="p-2 mr-2">
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              {selectedVerse.chapter && (
                <TouchableOpacity 
                  onPress={() => router.push(`/modal?type=chapter&chapterId=${selectedVerse.chapter?.chapter_number}`)}
                  className="flex-row items-center bg-gray-100 px-3 py-2 rounded-lg"
                >
                  <Ionicons name="arrow-back" size={16} color="#374151" />
                  <Text className="text-sm text-gray-700 ml-1">Back to Chapter</Text>
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => handleFavorite(selectedVerse.id)} className="p-2 mr-2">
                <Ionicons 
                  name={selectedVerse.isFavorite ? "heart" : "heart-outline"} 
                  size={24} 
                  color={selectedVerse.isFavorite ? "#EF4444" : "#374151"} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleShare(selectedVerse)} className="p-2">
                <Ionicons name="share-outline" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>
          
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Chapter {selectedVerse.chapter?.chapter_number} • Verse {selectedVerse.verse_number}
          </Text>
          <Text className="text-sm text-gray-500">
            {selectedVerse.chapter?.title_english}
          </Text>
        </View>

        {/* Verse Content */}
        <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-4">
            {/* Sanskrit Text */}
            <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
              <Text className="text-sm text-gray-500 mb-2">Sanskrit</Text>
              <Text className="text-lg text-orange-600 font-sanskrit leading-7">
                {selectedVerse.sanskrit_text}
              </Text>
            </View>

            {/* English Translation */}
            <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
              <Text className="text-sm text-gray-500 mb-2">English Translation</Text>
              <Text className="text-base text-gray-800 leading-6">
                {selectedVerse.english_translation}
              </Text>
            </View>

            {/* Hindi Translation (if available) */}
            {selectedVerse.hindi_translation && (
              <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
                <Text className="text-sm text-gray-500 mb-2">Hindi Translation</Text>
                <Text className="text-base text-gray-700 leading-6">
                  {selectedVerse.hindi_translation}
                </Text>
              </View>
            )}

            {/* Difficulty Level */}
            <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
              <Text className="text-sm text-gray-500 mb-2">Difficulty Level</Text>
              <View className="flex-row items-center">
                <View className={`px-3 py-1 rounded-full ${
                  selectedVerse.difficulty_level === 'beginner' ? 'bg-green-100' :
                  selectedVerse.difficulty_level === 'intermediate' ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  <Text className={`text-sm font-medium ${
                    selectedVerse.difficulty_level === 'beginner' ? 'text-green-700' :
                    selectedVerse.difficulty_level === 'intermediate' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {selectedVerse.difficulty_level?.charAt(0).toUpperCase() + selectedVerse.difficulty_level?.slice(1)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
              <View className="flex-row gap-2 mb-3">
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg ${
                    selectedVerse.isCompleted ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  onPress={() => handleMarkAsRead(selectedVerse.id)}
                >
                  <Text className="text-white text-center font-semibold">
                    {selectedVerse.isCompleted ? '✓ Completed' : 'Mark as Read'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg ${
                    selectedVerse.isFavorite ? 'bg-red-500' : 'bg-gray-200'
                  }`}
                  onPress={() => handleFavorite(selectedVerse.id)}
                >
                  <Text className={`text-center font-semibold ${
                    selectedVerse.isFavorite ? 'text-white' : 'text-gray-700'
                  }`}>
                    {selectedVerse.isFavorite ? '❤️ Favorited' : '❤️ Favorite'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Navigation Buttons */}
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 py-3 rounded-lg bg-gray-200"
                  onPress={handlePreviousVerse}
                  disabled={verses.findIndex(v => v.id === selectedVerse.id) <= 0}
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="chevron-back" size={16} color="#374151" />
                    <Text className="text-gray-700 font-semibold ml-1">Previous</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-1 py-3 rounded-lg bg-gray-200"
                  onPress={handleNextVerse}
                  disabled={verses.findIndex(v => v.id === selectedVerse.id) >= verses.length - 1}
                >
                  <View className="flex-row items-center justify-center">
                    <Text className="text-gray-700 font-semibold mr-1">Next</Text>
                    <Ionicons name="chevron-forward" size={16} color="#374151" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Keywords (if available) */}
            {selectedVerse.keywords && selectedVerse.keywords.length > 0 && (
              <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
                <Text className="text-sm text-gray-500 mb-3">Keywords</Text>
                <View className="flex-row flex-wrap">
                  {selectedVerse.keywords.map((keyword, index) => (
                    <View key={index} className="bg-orange-100 px-3 py-1 rounded-full mr-2 mb-2">
                      <Text className="text-sm text-orange-700">{keyword}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-gray-600 mt-4">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const type = Array.isArray(params.type) ? params.type[0] : params.type;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-gray-600 mt-4">Loading...</Text>
        </View>
      ) : (
        <>
          {type === 'chapter' && renderChapterContent()}
          {type === 'verse' && renderVerseContent()}
          {!type && (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-600">No content to display</Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}
