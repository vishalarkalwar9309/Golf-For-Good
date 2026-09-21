import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | Golf For Good`;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};
