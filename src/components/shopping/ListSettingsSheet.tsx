import React from 'react';
import Modal from '../ui/Modal';
import TextField from '../ui/TextField';
import Button from '../ui/Button';

interface ListSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  budget: string;
  store: string;
  onChangeBudget: (v: string) => void;
  onChangeStore: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
}

export default function ListSettingsSheet({
  isOpen,
  onClose,
  budget,
  store,
  onChangeBudget,
  onChangeStore,
  onSave,
  onDelete,
}: ListSettingsSheetProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="List settings">
      <TextField
        label="Budget"
        value={budget}
        onChangeText={onChangeBudget}
        keyboardType="decimal-pad"
      />
      <TextField
        label="Store"
        value={store}
        onChangeText={onChangeStore}
        placeholder="Costco"
      />
      <Button label="Save" onPress={onSave} className="mt-4" />
      <Button label="Delete list" variant="danger" onPress={onDelete} className="mt-2" />
    </Modal>
  );
}
