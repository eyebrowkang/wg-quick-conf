import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

export function useCopyContent() {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  const copyContent = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setHasCopied(true);
        setTimeout(() => {
          setHasCopied(false);
        }, 1000);
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: 'Copy Error!',
          description: 'Could not copy text.',
          variant: 'destructive',
        });
      });
  };

  return {
    hasCopied,
    copyContent,
  };
}
