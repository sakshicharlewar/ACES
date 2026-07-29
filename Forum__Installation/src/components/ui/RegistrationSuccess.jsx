import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Download, X, CreditCard } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function RegistrationSuccess({ data, onClose }) {
  const slipRef = useRef(null);

  const downloadPDF = async () => {
    const element = slipRef.current;
    if (!element) return;

    const originalStyle = element.style.cssText;
    element.style.display = 'block';
    element.style.backgroundColor = '#000000';
    element.style.color = '#ffffff';

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0B0B0B',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Registration_${data.registrationId}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      element.style.cssText = originalStyle;
    }
  };

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

        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle size={40} />
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-1">Registration Successful!</h2>
        <p className="text-gray-400 mb-6 text-sm">
          Your team <strong className="text-white">{data.teamName}</strong> has been registered.
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
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Payment Status</p>
            <p className="text-sm font-bold text-green-400 flex items-center gap-1">
              <CreditCard size={13} /> Paid ✓
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

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-3 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <QRCodeSVG value={data.registrationId} size={100} level="H" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-6">Present this QR at the event desk</p>

        <button
          onClick={downloadPDF}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-3"
        >
          <Download size={18} />
          Download Registration PDF
        </button>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors font-medium"
        >
          Close
        </button>

        {/* Hidden PDF Slip */}
        <div className="overflow-hidden h-0 w-0 absolute left-[-9999px]">
          <div ref={slipRef} className="w-[800px] p-12 bg-[#0B0B0B] text-white border border-gray-800">
            <div className="flex justify-between items-start border-b border-gray-800 pb-8 mb-8">
              <div>
                <h3 className="text-xl font-medium text-gray-400 mb-1">Association of Computer Engineering Students (ACES)</h3>
                <h1 className="text-4xl font-bold text-blue-500 mb-2">{data.eventName}</h1>
                <p className="text-xl text-gray-400">Team Registration Slip</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Registration ID</p>
                <p className="text-3xl font-mono font-bold text-white">{data.registrationId}</p>
              </div>
            </div>

            <div className="flex justify-between items-start mb-10">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-6 text-white border-b border-gray-800 pb-2 inline-block">Team Information</h2>
                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                  <div><p className="text-gray-500 text-sm">Team Name</p><p className="font-semibold text-lg">{data.teamName}</p></div>
                  <div><p className="text-gray-500 text-sm">Leader Name</p><p className="font-semibold text-lg">{data.leaderName}</p></div>
                  <div><p className="text-gray-500 text-sm">Leader Email</p><p className="font-semibold text-lg">{data.leaderEmail}</p></div>
                  <div><p className="text-gray-500 text-sm">Leader Phone</p><p className="font-semibold text-lg">{data.leaderPhone}</p></div>
                  <div><p className="text-gray-500 text-sm">Member 2</p><p className="font-semibold text-lg">{data.member2Name}</p></div>
                  <div><p className="text-gray-500 text-sm">Member 2 Email</p><p className="font-semibold text-lg">{data.member2Email}</p></div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl ml-8">
                <QRCodeSVG value={data.registrationId} size={160} level="H" />
              </div>
            </div>

            {/* Payment Section */}
            <div className="border border-gray-800 rounded-xl p-6 mb-8 bg-white/5">
              <h2 className="text-xl font-semibold text-white mb-4">Payment Details</h2>
              <div className="grid grid-cols-3 gap-6">
                <div><p className="text-gray-500 text-sm">Payment Status</p><p className="font-bold text-green-400 text-lg">✓ Paid</p></div>
                <div><p className="text-gray-500 text-sm">Registration Fee</p><p className="font-semibold text-lg">₹40</p></div>
                <div><p className="text-gray-500 text-sm">Transaction ID</p><p className="font-mono text-sm">{data.transactionId || '—'}</p></div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
              <p>Please present this QR code or Registration ID at the event desk.</p>
              <p className="mt-2">Generated on {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
