import React, { useState } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Order } from '../types';
import ImageUploadField from './ImageUploadField';

interface PaymentReceiptUploadProps {
  order: Order;
  onClose: () => void;
}

export default function PaymentReceiptUpload({ order, onClose }: PaymentReceiptUploadProps) {
  const { uploadPaymentReceipt } = useAppContext();
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setError('Please provide a receipt image URL');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await uploadPaymentReceipt(order.id, imageUrl);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to upload receipt. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Upload Payment Receipt</h3>
            <p className="text-xs text-gray-500 mt-1">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8 animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Payment Submitted!</h4>
              <p className="text-gray-500">Payment submitted – please wait for confirmation.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Instructions Summary */}
              {order.vendorPaymentDetails && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <h4 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Payment Instructions
                  </h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    {order.vendorPaymentDetails.instructions || `Please pay ${order.totalAmount} ${order.currency} via ${order.vendorPaymentDetails.name}.`}
                  </p>
                  {order.vendorPaymentDetails.qrCodeUrl && (
                    <div className="mt-3 flex justify-center">
                      <img 
                        src={order.vendorPaymentDetails.qrCodeUrl} 
                        alt="Payment QR Code" 
                        className="w-32 h-32 object-contain bg-white p-2 rounded-lg border border-emerald-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="mt-3 p-2 bg-white/50 rounded-lg text-[10px] font-mono text-emerald-800 break-all">
                    {order.vendorPaymentDetails.details}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <ImageUploadField
                  label="Payment Receipt / Screenshot"
                  value={imageUrl}
                  onChange={setImageUrl}
                  folder="payments/receipts"
                  placeholder="https://example.com/receipt.jpg"
                />
              </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploading || !imageUrl}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isUploading || !imageUrl ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-green-100'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Submit Receipt
                    </>
                  )}
                </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
