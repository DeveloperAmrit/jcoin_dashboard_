'use client';

import { useState } from 'react';
import { deleteCompany } from '@/app/admin/actions';
import EditCompanyModal from './EditCompanyModal';

interface Company {
  id: string;
  name: string;
  contact_person: string;
  contact_email: string;
  agreement_start_date: string | null;
  agreement_end_date: string | null;
  min_annual_jcoin_target: number;
}

export default function CompanyActions({ company }: { company: Company }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (confirm(`Are you sure you want to delete ${company.name}? This cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await deleteCompany(company.id);
      } catch (e) {
        alert('Failed to delete company');
        setIsDeleting(false);
      }
    }
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <EditCompanyModal company={company} />
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-red-500 hover:text-red-700 font-medium text-sm disabled:opacity-50"
      >
        {isDeleting ? '...' : 'Delete'}
      </button>
    </div>
  );
}
