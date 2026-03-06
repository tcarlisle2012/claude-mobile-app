import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getErrorMessage } from '../services/api';

export default function useApiQuery<T>(
  fetcher: () => Promise<T>,
  errorFallback: string,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const result = await fetcher();
      setData(result);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || errorFallback);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetcher, errorFallback]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refreshing, onRefresh, refetch: fetchData };
}
