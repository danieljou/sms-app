// app/sms-notification/page.tsx
"use client";

import { useRef, useState, forwardRef } from 'react';
import * as XLSX from 'xlsx';
import { FiUpload, FiUserPlus, FiTrash2, FiSend, FiX, FiFile, FiDollarSign, FiCreditCard, FiCalendar } from 'react-icons/fi';

interface Beneficiary {
  name: string;
  phone: string;
  reference: string;
  paymentMethod: 'cash' | 'transfer';
  accountNumber?: string;
}

const SMSNotificationApp = () => {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [notificationDate, setNotificationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const manualFormRef = useRef<HTMLFormElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSuccessMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet);

        const newBeneficiaries : Beneficiary[]= jsonData.map(row => ({
          name: row['Nom'] || row['Bénéficiaire'] || row['Name'] || '',
          phone: row['Téléphone'] || row['Phone'] || row['Numéro'] || '',
          reference: row['Référence'] || row['Bulletin'] || row['Reference'] || '',
          paymentMethod: (row['Méthode'] || row['Mode'] || 'cash').toLowerCase() === 'virement' ? 'transfer' : 'cash',
          accountNumber: row['Compte'] || row['IBAN'] || undefined
        }));

        setBeneficiaries(prev => [...prev, ...newBeneficiaries]);
        setSuccessMessage(`${newBeneficiaries.length} bénéficiaires ajoutés depuis le fichier`);
      } catch  {
        alert("Erreur lors de la lecture du fichier. Vérifiez le format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const addManualEntry = (data: Omit<Beneficiary, 'id'>) => {
    setBeneficiaries(prev => [...prev, data]);
    setSuccessMessage("Bénéficiaire ajouté avec succès");
    if (manualFormRef.current) manualFormRef.current.reset();
  };

  const removeBeneficiary = (index: number) => {
    setBeneficiaries(prev => prev.filter((_, i) => i !== index));
    setSuccessMessage("Bénéficiaire supprimé");
  };

  const generateSMSMessage = (beneficiary: Beneficiary) => {
    const baseMessage = `Bonjour ${beneficiary.name}\nVotre bon de commande ${beneficiary.reference} sera payé le ${notificationDate}.`;
    
    return beneficiary.paymentMethod === 'cash' 
      ? `${baseMessage}\nVous pouvez passer à la trésorerie.`
      : `${baseMessage}\nLe virement a été effectué sur votre compte.`;
  };

  const sendNotifications = async () => {
    if (beneficiaries.length === 0) return;
    
    setIsSending(true);
    setSuccessMessage(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      beneficiaries.forEach(beneficiary => {
        const message = generateSMSMessage(beneficiary);
        console.log(`Sending SMS to ${beneficiary.phone}: ${message}`);
        // API call would go here
      });
      
      setSuccessMessage(`✅ ${beneficiaries.length} notifications envoyées avec succès`);
    } catch  {
      alert("Erreur lors de l'envoi des notifications");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg mb-8">
        <h1 className="text-3xl font-bold mb-2">Notification des Paiements</h1>
        <p className="opacity-90">Envoyez des SMS aux bénéficiaires pour les informer de leurs paiements</p>
      </div>
      
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
          <div className="flex justify-between items-center">
            <p>{successMessage}</p>
            <button onClick={() => setSuccessMessage(null)} className="text-green-700 hover:text-green-900">
              <FiX size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* File Upload Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FiUpload className="text-blue-600 text-xl" />
            </div>
            <h2 className="text-xl font-semibold">Importation depuis Excel</h2>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center w-full bg-blue-50 text-blue-600 hover:bg-blue-100 px-6 py-4 rounded-lg border-2 border-dashed border-blue-200 transition-colors"
          >
            <FiFile className="mr-2" />
            Sélectionner un fichier Excel
          </button>
          <p className="mt-3 text-sm text-gray-500 text-center">
            Format supporté: .xlsx, .xls, .csv<br />
            Colonnes attendues: Nom, Téléphone, Référence, Mode de paiement
          </p>
        </div>

        {/* Manual Entry Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <FiUserPlus className="text-purple-600 text-xl" />
            </div>
            <h2 className="text-xl font-semibold">Ajout manuel</h2>
          </div>
          <ManualEntryForm onSubmit={addManualEntry} ref={manualFormRef} />
        </div>
      </div>

      {/* Date Selection Card */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-yellow-100 p-3 rounded-full mr-4">
            <FiCalendar className="text-yellow-600 text-xl" />
          </div>
          <h2 className="text-xl font-semibold">Date de paiement</h2>
        </div>
        <div className="flex items-center">
          <input
            type="date"
            value={notificationDate}
            onChange={(e) => setNotificationDate(e.target.value)}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="ml-3 text-gray-600">Les notifications incluront cette date</span>
        </div>
      </div>

      {/* Beneficiaries List Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <FiUserPlus className="text-green-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold">
                Liste des bénéficiaires <span className="text-blue-600">({beneficiaries.length})</span>
              </h2>
            </div>
            {beneficiaries.length > 0 && (
              <button
                onClick={() => setBeneficiaries([])}
                className="flex items-center text-red-500 hover:text-red-700 text-sm"
              >
                <FiTrash2 className="mr-1" /> Tout effacer
              </button>
            )}
          </div>
        </div>
        
        {beneficiaries.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiUserPlus className="text-gray-400 text-3xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-500">Aucun bénéficiaire ajouté</h3>
            <p className="text-gray-400 mt-1">Commencez par importer un fichier ou ajouter manuellement des bénéficiaires</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {beneficiaries.map((beneficiary, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{beneficiary.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{beneficiary.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{beneficiary.reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {beneficiary.paymentMethod === 'cash' ? (
                          <>
                            <FiDollarSign className="text-green-500 mr-2" />
                            <span>Espèces</span>
                          </>
                        ) : (
                          <>
                            <FiCreditCard className="text-blue-500 mr-2" />
                            <span>Virement</span>
                            {beneficiary.accountNumber && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {beneficiary.accountNumber}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      <div className="bg-gray-50 p-3 rounded">
                        {generateSMSMessage(beneficiary)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => removeBeneficiary(index)}
                        className="text-red-500 hover:text-red-700 flex items-center"
                        title="Supprimer"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-4">
        <button
          onClick={() => setBeneficiaries([])}
          disabled={beneficiaries.length === 0}
          className={`flex items-center justify-center px-6 py-3 rounded-lg ${beneficiaries.length === 0 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <FiTrash2 className="mr-2" />
          Tout effacer
        </button>
        <button
          onClick={sendNotifications}
          disabled={beneficiaries.length === 0 || isSending}
          className={`flex items-center justify-center px-6 py-3 rounded-lg text-white ${beneficiaries.length === 0 || isSending
            ? 'bg-green-300 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'} transition-colors`}
        >
          {isSending ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Envoi en cours...
            </>
          ) : (
            <>
              <FiSend className="mr-2" />
              Envoyer les notifications ({beneficiaries.length})
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Manual Entry Form Component with forwardRef
interface ManualEntryFormProps {
  onSubmit: (data: Omit<Beneficiary, 'id'>) => void;
}

const ManualEntryForm = forwardRef<HTMLFormElement, ManualEntryFormProps>(
  ({ onSubmit }, ref) => {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
    const [accountNumber, setAccountNumber] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const data = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        reference: formData.get('reference') as string,
        paymentMethod,
        accountNumber: paymentMethod === 'transfer' ? accountNumber : undefined
      };
      onSubmit(data);
    };

    return (
      <form ref={ref} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom du bénéficiaire</label>
          <input
            type="text"
            name="name"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nom complet"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              name="phone"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Numéro de téléphone"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de bulletin</label>
            <input
              type="text"
              name="reference"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Référence"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`flex items-center justify-center p-3 border rounded-lg ${paymentMethod === 'cash' 
                ? 'border-blue-500 bg-blue-50 text-blue-600' 
                : 'border-gray-300 hover:bg-gray-50'}`}
            >
              <FiDollarSign className="mr-2" />
              Espèces
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('transfer')}
              className={`flex items-center justify-center p-3 border rounded-lg ${paymentMethod === 'transfer' 
                ? 'border-blue-500 bg-blue-50 text-blue-600' 
                : 'border-gray-300 hover:bg-gray-50'}`}
            >
              <FiCreditCard className="mr-2" />
              Virement
            </button>
          </div>
        </div>
        
        {paymentMethod === 'transfer' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de compte</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="IBAN ou numéro de compte"
            />
          </div>
        )}
        
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
        >
          <FiUserPlus className="mr-2" />
          Ajouter le bénéficiaire
        </button>
      </form>
    );
  }
);

ManualEntryForm.displayName = 'ManualEntryForm';

export default SMSNotificationApp;