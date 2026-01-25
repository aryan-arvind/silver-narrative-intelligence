import { useState, useEffect, useCallback } from 'react';
import { mockNarratives, mockMetadata } from '../data/mockData';

const API_BASE = '';

export function useNarratives(demoMode = false) {
    const [narratives, setNarratives] = useState([]);
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchNarratives = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (demoMode) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            setNarratives(mockNarratives);
            setMetadata(mockMetadata);
            setLastUpdated(new Date());
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/narratives`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            setNarratives(data.narratives || []);
            setMetadata(data.metadata || {});
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch narratives:', err);
            setError(err.message);
            // Fallback to mock data
            setNarratives(mockNarratives);
            setMetadata(mockMetadata);
        } finally {
            setLoading(false);
        }
    }, [demoMode]);

    useEffect(() => {
        fetchNarratives();
    }, [fetchNarratives]);

    return {
        narratives,
        metadata,
        loading,
        error,
        lastUpdated,
        refresh: fetchNarratives,
    };
}
