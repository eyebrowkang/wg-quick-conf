import { useState } from 'react';
import { Button } from '@/components/ui/button.tsx';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="card">
      <Button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </Button>
    </div>
  );
}

export default App;
