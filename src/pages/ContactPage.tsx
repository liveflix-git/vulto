import React from 'react';
import { ContactSection } from '../components/ContactSection';

interface ContactPageProps {
  initialService?: string;
}

export const ContactPage: React.FC<ContactPageProps> = ({ initialService = '' }) => {
  return (
    <div className="bg-[#0A0A0A]">
      <ContactSection initialService={initialService} isFullPage={true} />
    </div>
  );
};
