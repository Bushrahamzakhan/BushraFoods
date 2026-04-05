import React from 'react';
import { ArrowLeft, Shield, Lock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button onClick={() => navigate(-1)} className="text-emerald-700 hover:text-emerald-900 mb-8 flex items-center gap-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Notice</h1>
        </div>

        <div className="prose prose-emerald max-w-none text-gray-600 space-y-6">
          <p className="text-lg">
            At Halal Market Online, we know that you care how information about you is used and shared, and we appreciate your trust that we will do so carefully and sensibly.
          </p>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-500" /> What Personal Information About Customers Does Halal Market Online Collect?
            </h2>
            <p>
              We collect your personal information in order to provide and continually improve our products and services. Here are the types of personal information we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Information You Give Us: We receive and store any information you provide in relation to Halal Market Online Services.</li>
              <li>Automatic Information: We automatically collect and store certain types of information about your use of Halal Market Online Services.</li>
              <li>Information from Other Sources: We might receive information about you from other sources, such as updated delivery and address information from our carriers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-500" /> How Secure Is Information About Me?
            </h2>
            <p>
              We design our systems with your security and privacy in mind.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>We work to protect the security of your personal information during transmission by using encryption protocols and software.</li>
              <li>We maintain physical, electronic, and procedural safeguards in connection with the collection, storage, and disclosure of customer personal information.</li>
              <li>It is important for you to protect against unauthorized access to your password and to your computers, devices, and applications.</li>
            </ul>
          </section>

          <p className="text-sm text-gray-400 pt-8 border-t border-gray-100">
            Last updated: April 1, 2026
          </p>
        </div>
      </div>
    </div>
  );
}
