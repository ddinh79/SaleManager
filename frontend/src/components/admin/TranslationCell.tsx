import React, { useState, useRef, useEffect } from 'react';

interface TranslationCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  isMissing?: boolean;
}

export const TranslationCell: React.FC<TranslationCellProps> = ({
  value,
  onSave,
  isMissing = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleSave = async () => {
    if (editValue === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(editValue);
      setEditing(false);
    } catch {
      setEditValue(value);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(value);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <td
        className={`px-4 py-2 cursor-pointer hover:bg-slate-100 ${isMissing || !value ? 'bg-yellow-50' : ''}`}
        onClick={() => setEditing(true)}
      >
        {value || <span className="text-yellow-500 italic">Missing</span>}
      </td>
    );
  }

  return (
    <td className="px-4 py-2">
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        disabled={saving}
        className={`w-full px-2 py-1 border rounded ${saving ? 'bg-slate-100' : ''}`}
      />
    </td>
  );
};