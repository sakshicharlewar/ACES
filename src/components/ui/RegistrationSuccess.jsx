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
