import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../utils/api';
import { hapticsService } from '../utils/haptics';
import { Chapter, VerseWithChapter } from '../types';
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
          const versesWithChapter = chapterVerses.map(verse => ({
            ...verse,
            chapter: chapterData,
            isCompleted: false,
            isFavorite: false,
          }));
          setVerses(versesWithChapter);
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

  const loadVerseContent = async (verseId: string) => {
    try {
      console.log('Loading verse content for verseId:', verseId);
      
      const verse = await apiService.getVerse(verseId);
      console.log('Retrieved verse:', verse ? 'yes' : 'no');
      
      if (verse) {
        // Get chapter for this verse
        const chapters = await apiService.getChapters();
        const chapterData = chapters.find(c => c.id === verse.chapter_id);

        const verseWithChapter: VerseWithChapter = {
          ...verse,
          chapter: chapterData || undefined,
          isCompleted: false,
          isFavorite: false,
        };

        setSelectedVerse(verseWithChapter);
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
    setSelectedVerse(verse);
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
        <View className="px-6 py-4">
          {verses.map((verse, index) => (
            <TouchableOpacity
              key={verse.id}
              onPress={() => handleVersePress(verse)}
              className="bg-white rounded-xl p-4 mb-4 shadow-sm"
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
            <TouchableOpacity onPress={handleClose} className="p-2">
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShare(selectedVerse)} className="p-2">
              <Ionicons name="share-outline" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Chapter {selectedVerse.chapter?.chapter_number} • Verse {selectedVerse.verse_number}
          </Text>
        </View>

        {/* Verse Content */}
        <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-4">
            <VerseCard
              verse={selectedVerse}
              onMarkAsRead={() => handleMarkAsRead(selectedVerse.id)}
              onFavorite={() => handleFavorite(selectedVerse.id)}
              onShare={() => handleShare(selectedVerse)}
              hasRead={selectedVerse.isCompleted}
              isFavorite={selectedVerse.isFavorite}
            />
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
