import { AssessmentSection } from './types';

// Fix: Corrected the type definition for INITIAL_FORM_SECTIONS_RAW by adding parentheses to correctly define it as an array of sections.
export const INITIAL_FORM_SECTIONS_RAW: (Omit<AssessmentSection, 'items'> & { items: Omit<AssessmentSection['items'][0], 'instances'>[] })[] = [
    {
      title: '1. Housekeeping & Cleanliness',
      items: [
        { id: '1.1', text: 'Dinding & Ventilasi', isRepeatable: true },
        { id: '1.2', text: 'Akses Masuk-Keluar', isRepeatable: true },
        { id: '1.3', text: 'Lantai & Tangga', isRepeatable: true },
        { id: '1.4', text: 'Jalur Pejalan Kaki', isRepeatable: true },
        { id: '1.5', text: 'Area Umum & Fasilitas', isRepeatable: true },
        { id: '1.6', text: 'Kebersihan Alat Berat', isRepeatable: true },
      ],
    },
    {
      title: '2. Occupational Health & Safety',
      items: [
        { id: '2.1', text: 'Penggunaan APD', isRepeatable: true },
        { id: '2.2', text: 'Rambu & Marka Keselamatan', isRepeatable: true },
        { id: '2.3', text: 'Titik Kumpul', isRepeatable: true },
        { id: '2.4', text: 'P3K & Fasilitas Medis', isRepeatable: true },
        { id: '2.5', text: 'Manajemen Lalu Lintas Kendaraan Berat', isRepeatable: true },
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
      ],
    },
];

export const DEFAULT_RECIPIENT_EMAIL = 'area.report@example.com';