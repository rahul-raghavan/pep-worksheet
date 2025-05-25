export function routeToPrint(questions: any[], mode: 'problems' | 'answers' = 'problems') {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('worksheet', JSON.stringify(questions));
  } catch {}
  const url = `/print?mode=${mode}`;
  const win = window.open(url, '_blank');
  if (win) {
    win.focus();
    // Wait for the new window to load, then trigger print
    win.onload = () => {
      setTimeout(() => {
        win.print();
      }, 300);
    };
  }
} 