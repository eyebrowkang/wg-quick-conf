import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
import { Button } from '@/components/ui/button.tsx';
import { CheckIcon, ClipboardIcon } from 'lucide-react';
import { useCopyContent } from '@/hooks/copy';

export function KeyItem({
  label,
  content,
}: {
  label: string;
  content: string;
}) {
  const { hasCopied, copyContent } = useCopyContent();

  return (
    <div>
      <div className="flex items-center">
        <div>{label}</div>
      </div>
      <div className="relative flex items-center">
        <pre className="w-fit rounded-lg border bg-slate-800 py-2 pl-4 pr-10">
          <code className="inline-flex w-full overflow-x-auto bg-transparent font-mono text-sm text-slate-100 no-scrollbar max-sm:w-60">
            <span>{content}</span>
          </code>
        </pre>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => copyContent(content)}
              variant="ghost"
              size="icon"
              className="absolute right-2 ml-auto h-6 w-6 text-slate-100 hover:bg-slate-700 hover:text-slate-100"
            >
              {hasCopied ? (
                <CheckIcon size={16} />
              ) : (
                <ClipboardIcon size={16} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasCopied ? 'Copied!' : 'Copy Content'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
