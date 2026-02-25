import React, { useRef } from 'react';

function SettingsPage({ progress, onSettingsChange, onReset, onImport }) {
  const fileRef = useRef(null);

  function exportData() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patente-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        onImport(parsed);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }

  return (
    <section className='page'>
      <h2>Settings</h2>
      <div className='panel'>
        <h3>Daily goals</h3>
        <label>Quiz questions <input type='number' value={progress.settings.dailyQuizGoal} onChange={(e) => onSettingsChange({ dailyQuizGoal: Number(e.target.value) })} /></label>
        <label>Vocab cards <input type='number' value={progress.settings.dailyVocabGoal} onChange={(e) => onSettingsChange({ dailyVocabGoal: Number(e.target.value) })} /></label>
      </div>

      <div className='panel'>
        <h3>Theme</h3>
        <label><input type='radio' name='theme' checked={progress.settings.theme === 'light'} onChange={() => onSettingsChange({ theme: 'light' })} /> Light</label>
        <label><input type='radio' name='theme' checked={progress.settings.theme === 'dark'} onChange={() => onSettingsChange({ theme: 'dark' })} /> Dark</label>
      </div>

      <div className='panel'>
        <h3>Exam simulator</h3>
        <label>Questions <input type='number' value={progress.settings.simulatorQuestions} onChange={(e) => onSettingsChange({ simulatorQuestions: Number(e.target.value) })} /></label>
        <label>Max errors <input type='number' value={progress.settings.simulatorMaxErrors} onChange={(e) => onSettingsChange({ simulatorMaxErrors: Number(e.target.value) })} /></label>
        <label><input type='checkbox' checked={progress.settings.simulatorTimer} onChange={(e) => onSettingsChange({ simulatorTimer: e.target.checked })} /> Timer</label>
      </div>
      <div className='panel'>
        <h3>Data</h3>
        <button onClick={exportData}>Export progress JSON</button>
        <button onClick={() => fileRef.current?.click()}>Import progress JSON</button>
        <input ref={fileRef} type='file' accept='application/json' onChange={importData} hidden />
        <button className='danger' onClick={onReset}>Reset progress</button>
      </div>
    </section>
  );
}

export default SettingsPage;
