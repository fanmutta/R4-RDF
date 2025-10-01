import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

//================================================================
// TYPES
//================================================================
type Status = 'OK' | 'Not OK' | 'N/A' | null;

interface AssessmentItemInstance {
  status: Status;
  description: string;
  photo: File | null;
}

interface AssessmentItem {
  id: string;
  text: string;
  isRepeatable?: boolean;
  instances: AssessmentItemInstance[];
}

interface AssessmentSection {
  title: string;
  items: AssessmentItem[];
}

interface HeaderData {
  assessmentDate: string;
  areaLocation: string;
  assessorName: string;
}

interface FollowUpData {
  summary: string;
  recommendations: string;
  personInCharge: string;
  targetDate: string;
}

interface FormData {
  header: HeaderData;
  sections: AssessmentSection[];
  followUp: FollowUpData;
}

//================================================================
// CONSTANTS
//================================================================
const INITIAL_FORM_SECTIONS: (Omit<AssessmentSection, 'items'> & { items: { id: string, text: string, isRepeatable?: boolean }[] })[] = [
  {
    title: '1. Housekeeping & Cleanliness',
    items: [
      { id: '1.1', text: 'Dinding & Ventilasi', isRepeatable: true },
      { id: '1.2', text: 'Jendela', isRepeatable: true },
      { id: '1.3', text: 'Pintu', isRepeatable: true },
      { id: '1.4', text: 'Lantai & Tangga', isRepeatable: true },
      { id: '1.5', text: 'Jalur Pejalan Kaki', isRepeatable: true },
      { id: '1.6', text: 'Area Umum & Fasilitas', isRepeatable: true },
      { id: '1.7', text: 'Kebersihan Alat Berat', isRepeatable: true },
      { id: '1.8', text: 'Pengendalian Debu', isRepeatable: true },
    ],
  },
  {
    title: '2. Occupational Health & Safety',
    items: [
      { id: '2.1', text: 'Penggunaan APD', isRepeatable: true },
      { id: '2.2', text: 'Rambu & Marka Keselamatan', isRepeatable: true },
      { id: '2.3', text: 'Titik Kumpul', isRepeatable: true },
      { id: '2.4', text: 'P3K & Fasilitas Medis', isRepeatable: true },
      { id: '2.5', text: 'Manajemen Kebisingan', isRepeatable: true },
      { id: '2.6', text: 'Manajemen Lalu Lintas Kendaraan Berat', isRepeatable: true },
    ],
  },
  {
    title: '3. Material & Product Management',
    items: [
      { id: '3.1', text: 'Area Sampah Masuk/MSW', isRepeatable: true },
      { id: '3.2', text: 'Fasilitas Pengumpanan', isRepeatable: true },
      { id: '3.3', text: 'Proses RDF', isRepeatable: true },
      { id: '3.4', text: 'Produk RDF', isRepeatable: true },
      { id: '3.5', text: 'Penyimpanan RDF', isRepeatable: true },
      { id: '3.6', text: 'Kualitas Visual Produk RDF', isRepeatable: true },
      { id: '3.7', text: 'Ukuran', isRepeatable: true },
      { id: '3.8', text: 'Kelembaban', isRepeatable: true },
      { id: '3.9', text: 'Manajemen Lindi', isRepeatable: true },
      { id: '3.10', text: 'Kontrol Kualitas & Laboratorium (Sampel)', isRepeatable: true },
    ],
  },
  {
    title: '4. Equipment & Operational Condition',
    items: [
      { id: '4.1', text: 'Kondisi Mesin (Shredder, Conveyor)', isRepeatable: true },
      { id: '4.2', text: 'Sistem Proteksi Mesin (Guard, Interlock)', isRepeatable: true },
      { id: '4.3', text: 'Pemantauan Kondisi Mesin', isRepeatable: true },
      { id: '4.4', text: 'Sistem Proteksi Kebakaran', isRepeatable: true },
      { id: '4.5', text: 'Sistem Deteksi & Pemadaman Api Otomatis', isRepeatable: true },
    ],
  },
  {
    title: '5. Environmental Management & Compliance',
    items: [
      { id: '5.1', text: 'Sistem Manajemen Lindi', isRepeatable: true },
      { id: '5.2', text: 'Pengendalian Emisi Debu & Bau', isRepeatable: true },
      { id: '5.3', text: 'Manajemen Limbah B3 & Residu', isRepeatable: true },
      { id: '5.4', text: 'Kepatuhan terhadap Izin Lingkungan', isRepeatable: true },
    ],
  },
  {
    title: '6. Emergency Preparedness',
    items: [
      { id: '6.1', text: 'Prosedur Tanggap Darurat (ERP)', isRepeatable: true },
      { id: '6.2', text: 'Sistem Alarm & Komunikasi Darurat', isRepeatable: true },
      { id: '6.3', text: 'Pelatihan & Simulasi Tanggap Darurat', isRepeatable: true },
      { id: '6.4', text: 'Ketersediaan APAR & Hidran', isRepeatable: true },
    ],
  },
];

//================================================================
// COMPONENTS
//================================================================

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-xl transform transition-all sm:max-w-4xl w-full m-4 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-gray-100 text-gray-800 rounded-full p-1 leading-none hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 z-10"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
};

type ImageInputProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  onThumbnailClick?: (file: File) => void;
};

const ImageInput: React.FC<ImageInputProps> = ({ file, onChange, onThumbnailClick }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    onChange(selectedFile || null);
  };
  
  const handleRemoveImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handlePreviewClick = () => {
    if (file && onThumbnailClick) {
      onThumbnailClick(file);
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0 && droppedFiles[0].type.startsWith('image/')) {
      onChange(droppedFiles[0]);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />
      {!preview ? (
        <div
          onClick={handleBrowseClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`w-full h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors ${
            isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>{isDraggingOver ? 'Drop file here' : 'Click or drag photo here'}</span>
        </div>
      ) : (
        <div className="relative w-full h-32">
          <img
            src={preview}
            alt="Preview"
            onClick={handlePreviewClick}
            className={`w-full h-full object-cover rounded-md ${onThumbnailClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            aria-label="Remove image"
            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 leading-none hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

type ItemInstanceRowProps = {
  item: AssessmentItem;
  instance: AssessmentItemInstance;
  sectionIndex: number;
  itemIndex: number;
  instanceIndex: number;
  isInvalid: boolean;
  onStatusChange: (sectionIndex: number, itemIndex: number, instanceIndex: number, status: Status) => void;
  onDescriptionChange: (sectionIndex: number, itemIndex: number, instanceIndex: number, description: string) => void;
  onPhotoChange: (sectionIndex: number, itemIndex: number, instanceIndex: number, photo: File | null) => void;
  onRemove: (sectionIndex: number, itemIndex: number, instanceIndex: number) => void;
};

const ItemInstanceRow: React.FC<ItemInstanceRowProps> = ({
  item,
  instance,
  sectionIndex,
  itemIndex,
  instanceIndex,
  isInvalid,
  onStatusCh
