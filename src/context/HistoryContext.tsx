import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AnalysisResult } from '../types/pose';
import { KeyMetrics } from '../types/report';
import analysisData from '../../assets/analysis/20260217_124527_testvideo_analysis.json';

export interface HistoryItem {
  id: string;
  analysisData: AnalysisResult;
  videoPath: string;
  thumbnailUri?: string;
  keyMetrics: KeyMetrics;
  addedAt: Date;
}

interface HistoryContextType {
  analyses: HistoryItem[];
  addAnalysis: (item: Omit<HistoryItem, 'id' | 'addedAt'>) => void;
  getAnalysisById: (id: string) => HistoryItem | undefined;
  getAllAnalyses: () => HistoryItem[];
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

  return (
    <HistoryContext.Provider
      value={{
        analyses,
        addAnalysis,
        getAnalysisById,
        getAllAnalyses,
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
