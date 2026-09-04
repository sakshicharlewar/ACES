import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X, CreditCard, Clock } from 'lucide-react';

export default function RegistrationSuccess({ data, onClose }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#0B0B0B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto p-8 text-center"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Pending Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="w-20 h-20 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Clock size={40} />
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-1">Registration Submitted!</h2>
        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
          Your registration for <strong className="text-white">{data.teamName}</strong> has been received and is currently under review. 
          You will receive an email once your registration is approved.
        </p>

        {/* Registration ID */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Registration ID</p>
          <p className="text-3xl font-mono font-bold text-blue-400">{data.registrationId}</p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Team</p>
            <p className="text-sm font-medium text-white truncate">{data.teamName}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Event</p>
            <p className="text-sm font-medium text-white truncate">{data.eventName}</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <p className="text-sm font-bold text-yellow-400 flex items-center gap-1">
              <Clock size={13} /> Pending Approval
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
            <p className="text-sm font-mono text-white truncate">{data.transactionId || '—'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 col-span-2">
            <p className="text-xs text-gray-500 mb-1">Date & Time</p>
            <p className="text-sm text-white">{data.registeredAt || new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* WhatsApp Group Link */}
        <div className="mb-6 p-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-green-400 text-sm">📱</span>
            <p className="text-xs font-semibold text-green-300 uppercase tracking-wider">Next Step: Join Official Group</p>
          </div>
          <p className="text-xs text-gray-300 mb-3 leading-relaxed">
            Join the official WhatsApp group for round schedules, seat numbers, and live event updates:
          </p>
          <a 
            href={data?.whatsapp_link || data?.whatsappLink || "https://chat.whatsapp.com/CGfM1W53tQ2A8vT1B0nZzF"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#1DA851] text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] text-sm"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            💬 Join Official WhatsApp Group
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-3"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
