import React, { useState } from 'react';
import { ChevronLeft, User as UserIcon, HelpCircle } from 'lucide-react';
import { AssessmentInput, ScreenName } from '../types';

interface AssessmentScreenProps {
  onBack: () => void;
  onSubmit: (input: AssessmentInput) => void;
}

export default function AssessmentScreen({ onBack, onSubmit }: AssessmentScreenProps) {
  // Local form states
  const [jenisKelamin, setJenisKelamin] = useState('');
  const [tipePerusahaan, setTipePerusahaan] = useState('');
  const [wfhSetup, setWfhSetup] = useState(true);
  const [levelJabatan, setLevelJabatan] = useState(2); // 1-3 (Sedang default)
  const [alokasiSumberDaya, setAlokasiSumberDaya] = useState(2); // 1-4 (Cukup default)
  const [skorKelebihanMental, setSkorKelebihanMental] = useState(2); // 1-4 (Sedang default)

  // Track how many fields are filled out of 4 core groups to show realistic progress
  // 1: Jenis Kelamin, 2: Tipe Perusahaan, 3: Sliders (mental overload, resources etc), 4: Configuration toggles
  const getProgress = () => {
    let count = 0;
    if (jenisKelamin) count += 1;
    if (tipePerusahaan) count += 1;
    if (skorKelebihanMental !== 2 || alokasiSumberDaya !== 2 || levelJabatan !== 2) count += 1;
    if (wfhSetup !== undefined) count += 1;
    return count;
  };

  const currentStep = Math.max(1, getProgress());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenisKelamin) {
      alert('Silakan pilih Jenis Kelamin Anda terlebih dahulu.');
      return;
    }
    if (!tipePerusahaan) {
      alert('Silakan pilih Tipe Perusahaan Anda terlebih dahulu.');
      return;
    }

    const payload: AssessmentInput = {
      jenisKelamin,
      tipePerusahaan,
      wfhSetup,
      levelJabatan,
      alokasiSumberDaya,
      skorKelebihanMental,
    };

    onSubmit(payload);
  };

  return (
    <div className="flex flex-col h-full bg-elegant-bg text-slate-300 overflow-y-auto">
      {/* Header bar */}
      <div className="bg-elegant-panel border-b border-white/5 py-4 px-5 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-md">
        <button
          onClick={onBack}
          aria-label="Kembali"
          className="p-1 px-2.5 rounded-lg text-slate-300 hover:bg-white/5 transition flex items-center text-xs font-bold"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          <span>Kembali</span>
        </button>
        <span className="font-serif-elegant font-bold text-white text-base">Asesmen Indeks</span>
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-300">
          <UserIcon className="w-4 h-4" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          {/* Progress indicators matched perfectly with mockup screenshots */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <span className="text-elegant-gold">Kemajuan - Modul {currentStep} dari 4</span>
              <span className="text-slate-500">{currentStep} / 4</span>
            </div>
            {/* Horizontal progress indicators */}
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step <= currentStep ? 'bg-gradient-to-r from-elegant-gold to-elegant-gold-dark shadow-xs' : 'bg-white/5'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Form Fields: Jenis Kelamin */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400" htmlFor="select-jenis-kelamin">
              Jenis Kelamin
            </label>
            <div className="relative">
              <select
                id="select-jenis-kelamin"
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value)}
                className="w-full bg-elegant-panel border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-elegant-gold focus:ring-1 focus:ring-elegant-gold outline-none transition appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-elegant-bg text-slate-400">Pilih Jenis Kelamin</option>
                <option value="Laki-laki" className="bg-elegant-bg text-white">Laki-laki</option>
                <option value="Perempuan" className="bg-elegant-bg text-white">Perempuan</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Tipe Perusahaan */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400" htmlFor="select-tipe-perusahaan">
              Tipe Perusahaan
            </label>
            <div className="relative">
              <select
                id="select-tipe-perusahaan"
                value={tipePerusahaan}
                onChange={(e) => setTipePerusahaan(e.target.value)}
                className="w-full bg-elegant-panel border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-elegant-gold focus:ring-1 focus:ring-elegant-gold outline-none transition appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-elegant-bg text-slate-400">Pilih Tipe Perusahaan</option>
                <option value="Teknologi" className="bg-elegant-bg text-white">Teknologi / Start Up</option>
                <option value="Keuangan" className="bg-elegant-bg text-white">Keuangan / Perbankan</option>
                <option value="Kesehatan" className="bg-elegant-bg text-white">Kesehatan / Medis</option>
                <option value="Manufaktur" className="bg-elegant-bg text-white">Manufaktur / Logistik</option>
                <option value="Pendidikan" className="bg-elegant-bg text-white">Pendidikan / Akademik</option>
                <option value="Lainnya" className="bg-elegant-bg text-white">Lainnya</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* WFH Setup Toggle Switch */}
          <div className="bg-elegant-panel/50 rounded-xl p-4 border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="block text-sm font-bold text-white">WFH Setup</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Bekerja secara WFH/Remote</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWfhSetup(!wfhSetup)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  wfhSetup ? 'bg-gradient-to-r from-elegant-gold to-elegant-gold-dark' : 'bg-white/5'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    wfhSetup ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs font-bold text-slate-300 w-16">
                {wfhSetup ? 'Tersedia' : 'Tidak Ada'}
              </span>
            </div>
          </div>

          {/* SLIDER 1: Level Jabatan */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Level Jabatan</span>
              <span className="text-xs font-bold text-elegant-gold">
                {levelJabatan === 1 ? 'Rendah (Staff)' : levelJabatan === 2 ? 'Sedang (Lead)' : 'Tinggi (Manager)'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={levelJabatan}
              onChange={(e) => setLevelJabatan(Number(e.target.value))}
              className="w-full cursor-pointer accent-elegant-gold"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-500 px-1 font-mono">
              <span>STAFF</span>
              <span>LEAD</span>
              <span>MANAGER</span>
            </div>
          </div>

          {/* SLIDER 2: Alokasi Sumber Daya */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Alokasi Sumber Daya</span>
              <span className="text-xs font-bold text-elegant-gold">
                {alokasiSumberDaya === 1
                  ? 'Buruk'
                  : alokasiSumberDaya === 2
                  ? 'Cukup'
                  : alokasiSumberDaya === 3
                  ? 'Baik'
                  : 'Sangat Baik'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="4"
              step="1"
              value={alokasiSumberDaya}
              onChange={(e) => setAlokasiSumberDaya(Number(e.target.value))}
              className="w-full cursor-pointer accent-elegant-gold"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-500 px-1 font-mono">
              <span>BURUK</span>
              <span>CUKUP</span>
              <span>BAIK</span>
              <span>SANGAT BAIK</span>
            </div>
          </div>

          {/* SLIDER 3: Skor Kelebihan Mental */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Skor Kelebihan Mental</span>
                <div className="group relative">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-pointer" />
                  <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block w-44 p-2 bg-slate-900 border border-white/5 text-[10px] text-slate-300 rounded-lg shadow-md leading-relaxed z-20">
                    Beban kognitif berlebih karena tugas bertumpuk.
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-elegant-gold">
                {skorKelebihanMental === 1
                  ? 'Rendah'
                  : skorKelebihanMental === 2
                  ? 'Sedang'
                  : skorKelebihanMental === 3
                  ? 'Tinggi'
                  : 'Sangat Tinggi'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="4"
              step="1"
              value={skorKelebihanMental}
              onChange={(e) => setSkorKelebihanMental(Number(e.target.value))}
              className="w-full cursor-pointer accent-elegant-gold"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-500 px-1 font-mono">
              <span>RENDAH</span>
              <span>SEDANG</span>
              <span>TINGGI</span>
              <span>SANGAT TINGGI</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="btn-submit-assessment-form"
          className="w-full bg-gradient-to-r from-elegant-gold to-elegant-gold-dark text-black font-extrabold py-3.5 rounded-xl hover:brightness-110 active:scale-98 shadow-md transition text-xs uppercase tracking-widest cursor-pointer mt-6"
        >
          Kirim Penilaian
        </button>
      </form>
    </div>
  );
}
