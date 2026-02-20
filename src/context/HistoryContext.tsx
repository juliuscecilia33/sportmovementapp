import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AnalysisResult } from '../types/pose';
import { KeyMetrics } from '../types/report';
import { FrameNote } from '../types/notes';
import analysisData from '../../assets/analysis/20260217_124527_testvideo_analysis.json';

export interface HistoryItem {
  id: string;
  analysisData: AnalysisResult;
  videoPath: string;
  thumbnailUri?: string;
  keyMetrics: KeyMetrics;
  addedAt: Date;
  assignedTo?: string; // Player name this video is assigned to
}

interface HistoryContextType {
  analyses: HistoryItem[];
  addAnalysis: (item: Omit<HistoryItem, 'id' | 'addedAt'>) => void;
  getAnalysisById: (id: string) => HistoryItem | undefined;
  getAllAnalyses: () => HistoryItem[];
  assignVideo: (analysisId: string, playerName: string) => void;
  addFrameNote: (analysisId: string, note: Omit<FrameNote, 'id' | 'createdAt'>) => void;
  updateFrameNote: (analysisId: string, noteId: string, newText: string) => void;
  deleteFrameNote: (analysisId: string, noteId: string) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
  console.log('[HistoryContext] HistoryProvider rendering...');
  const [analyses, setAnalyses] = useState<HistoryItem[]>([]);

  // Initialize with the bundled test video on mount
  useEffect(() => {
    console.log('[HistoryContext] Initializing with test video...');
    const initialAnalysis: HistoryItem = {
      id: '20260217_124527_testvideo',
      analysisData: analysisData as AnalysisResult,
      videoPath: require('../../assets/videos/testvideo.mp4'),
      keyMetrics: {
        peakVelocity: 0,
        peakVelocityFrame: 0,
        averageVelocity: 0,
        maxElbowAngle: null,
        minElbowAngle: null,
        maxShoulderAngle: null,
        armExtensionRange: { min: 0, max: 0, range: 0 },
        jumpHeight: null,
        highestBodyPositionFrame: null,
        lowestBodyPositionFrame: null,
        averageTorsoAngle: null,
        shoulderWidth: null,
      },
      addedAt: new Date('2026-02-17T12:45:27'),
    };

    setAnalyses([initialAnalysis]);
    console.log('[HistoryContext] Initial analysis set:', initialAnalysis.id);
  }, []);

  const addAnalysis = (item: Omit<HistoryItem, 'id' | 'addedAt'>) => {
    console.log('[HistoryContext] Adding new analysis...');
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      addedAt: new Date(),
    };
    setAnalyses((prev) => [newItem, ...prev]);
    console.log('[HistoryContext] Analysis added with ID:', newItem.id);
  };

  const getAnalysisById = (id: string): HistoryItem | undefined => {
    console.log('[HistoryContext] Getting analysis by ID:', id);
    const result = analyses.find((item) => item.id === id);
    console.log('[HistoryContext] Found analysis:', result ? result.id : 'not found');
    return result;
  };

  const getAllAnalyses = (): HistoryItem[] => {
    console.log('[HistoryContext] Getting all analyses, count:', analyses.length);
    return analyses;
  };

  const assignVideo = (analysisId: string, playerName: string) => {
    console.log('[HistoryContext] Assigning video', analysisId, 'to player:', playerName);
    setAnalyses((prev) =>
      prev.map((item) =>
        item.id === analysisId ? { ...item, assignedTo: playerName } : item
      )
    );
  };

  const addFrameNote = (analysisId: string, note: Omit<FrameNote, 'id' | 'createdAt'>) => {
    console.log('[HistoryContext] Adding frame note to analysis:', analysisId);
    setAnalyses((prev) =>
      prev.map((item) => {
        if (item.id === analysisId) {
          const newNote: FrameNote = {
            ...note,
            id: Date.now().toString(),
            createdAt: new Date(),
          };
          const existingNotes = item.analysisData.frameNotes || [];
          return {
            ...item,
            analysisData: {
              ...item.analysisData,
              frameNotes: [...existingNotes, newNote],
            },
          };
        }
        return item;
      })
    );
  };

  const updateFrameNote = (analysisId: string, noteId: string, newText: string) => {
    console.log('[HistoryContext] Updating frame note:', noteId, 'in analysis:', analysisId);
    setAnalyses((prev) =>
      prev.map((item) => {
        if (item.id === analysisId && item.analysisData.frameNotes) {
          return {
            ...item,
            analysisData: {
              ...item.analysisData,
              frameNotes: item.analysisData.frameNotes.map((note) =>
                note.id === noteId ? { ...note, noteText: newText } : note
              ),
            },
          };
        }
        return item;
      })
    );
  };

  const deleteFrameNote = (analysisId: string, noteId: string) => {
    console.log('[HistoryContext] Deleting frame note:', noteId, 'from analysis:', analysisId);
    setAnalyses((prev) =>
      prev.map((item) => {
        if (item.id === analysisId && item.analysisData.frameNotes) {
          return {
            ...item,
            analysisData: {
              ...item.analysisData,
              frameNotes: item.analysisData.frameNotes.filter((note) => note.id !== noteId),
            },
          };
        }
        return item;
      })
    );
  };

  return (
    <HistoryContext.Provider
      value={{
        analyses,
        addAnalysis,
        getAnalysisById,
        getAllAnalyses,
        assignVideo,
        addFrameNote,
        updateFrameNote,
        deleteFrameNote,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
