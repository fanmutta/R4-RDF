
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { FormData, Status, FormHeaderData, FollowUpData } from './types';
import { INITIAL_FORM_SECTIONS_RAW, DEFAULT_RECIPIENT_EMAIL } from './constants';
import { FormHeader } from './components/FormHeader';
import { SummaryDashboard } from './components/SummaryDashboard';
import { AssessmentSection } from './components/AssessmentSection';
import { FollowUpSection } from './components/FollowUpSection';
import { Modal } from './components/Modal';
import { sbiLogoBase64 } from './components/sbiLogo';

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const getInitialFormData = (): FormData => {
  const sectionsWithState = INITIAL_FORM_SECTIONS_RAW.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      instances: [{ status: null, description: '', photo: null }],
    })),
  }));

  return {
    header: {
      assessmentDate: new Date().toISOString().split('T')[0],
      areaLocation: '',
      assessorName: '',
    },
    sections: sectionsWithState,
    followUp: {
      summary: '',
      recommendations: '',
      personInCharge: '',
      targetDate: '',
    },
  };
};

const App: React.FC = () => {
    const [formData, setFormData] = useState<FormData>(getInitialFormData());
    const [openSectionIndex, setOpenSectionIndex] = useState<number | null>(0);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [filterNotOK, setFilterNotOK] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [emailRecipient, setEmailRecipient] = useState(DEFAULT_RECIPIENT_EMAIL);

    const validateForm = useCallback(() => {
        const errors: string[] = [];
        let firstErrorSectionIndex: number | null = null;
        let hasNullStatus = false;
        let hasMissingDescription = false;

        formData.sections.forEach((section, sectionIndex) => {
            section.items.forEach((item) => {
                item.instances.forEach((instance, instanceIndex) => {
                    const instanceId = `${item.id}-${instanceIndex}`;
                    if (instance.status === null) {
                        errors.push(instanceId);
                        hasNullStatus = true;
                        if (firstErrorSectionIndex === null) firstErrorSectionIndex = sectionIndex;
                    } else if (instance.status === 'Not OK' && !instance.description.trim()) {
                        errors.push(instanceId);
                        hasMissingDescription = true;
                        if (firstErrorSectionIndex === null) firstErrorSectionIndex = sectionIndex;
                    }
                });
            });
        });

        setValidationErrors(errors);

        if (errors.length > 0) {
            let alertMessage = 'Form is incomplete!\n';
            if (hasNullStatus) alertMessage += '- Please complete all assessment statuses (OK/Not OK/N/A).\n';
            if (hasMissingDescription) alertMessage += '- Please fill in the description for all items with "Not OK" status.\n';
            alert(alertMessage);
            if (firstErrorSectionIndex !== null && openSectionIndex !== firstErrorSectionIndex) {
                setOpenSectionIndex(firstErrorSectionIndex);
            }
            return false;
        }
        return true;
    }, [formData.sections, openSectionIndex]);

    const handleHeaderChange = useCallback((field: keyof FormHeaderData, value: string) => {
        setFormData(prev => ({ ...prev, header: { ...prev.header, [field]: value } }));
    }, []);

    const handleFollowUpChange = useCallback((field: keyof FollowUpData, value: string) => {
        setFormData(prev => ({ ...prev, followUp: { ...prev.followUp, [field]: value } }));
    }, []);

    const updateValidationErrors = (instanceId: string, isValid: boolean) => {
        setValidationErrors(prev => {
            if (isValid) return prev.filter(err => err !== instanceId);
            return prev.includes(instanceId) ? prev : [...prev, instanceId];
        });
    };

    const handleStatusChange = useCallback((sectionIndex: number, itemIndex: number, instanceIndex: number, status: Status) => {
        setFormData(prev => {
            const newSections = JSON.parse(JSON.stringify(prev.sections));
            const instance = newSections[sectionIndex].items[itemIndex].instances[instanceIndex];
            const newStatus = instance.status === status ? null : status;
            instance.status = newStatus;

            const instanceId = `${newSections[sectionIndex].items[itemIndex].id}-${instanceIndex}`;
            const isValid = newStatus !== null && (newStatus !== 'Not OK' || instance.description.trim() !== '');
            updateValidationErrors(instanceId, isValid);

            return { ...prev, sections: newSections };
        });
    }, []);

    const handleDescriptionChange = useCallback((sectionIndex: number, itemIndex: number, instanceIndex: number, description: string) => {
        setFormData(prev => {
            const newSections = JSON.parse(JSON.stringify(prev.sections));
            const instance = newSections[sectionIndex].items[itemIndex].instances[instanceIndex];
            instance.description = description;

            const instanceId = `${newSections[sectionIndex].items[itemIndex].id}-${instanceIndex}`;
            const isValid = instance.status !== 'Not OK' || description.trim() !== '';
            updateValidationErrors(instanceId, isValid);

            return { ...prev, sections: newSections };
        });
    }, []);

    const handlePhotoChange = useCallback((sectionIndex: number, itemIndex: number, instanceIndex: number, photo: File | null) => {
        setFormData(prev => {
            const newSections = [...prev.sections];
            newSections[sectionIndex].items[itemIndex].instances[instanceIndex].photo = photo;
            return { ...prev, sections: newSections };
        });
    }, []);

    const handleAddItemInstance = useCallback((sectionIndex: number, itemIndex: number) => {
        setFormData(prev => {
            const newSections = JSON.parse(JSON.stringify(prev.sections));
            newSections[sectionIndex].items[itemIndex].instances.push({ status: null, description: '', photo: null });
            return { ...prev, sections: newSections };
        });
    }, []);
    
    const handleRemoveItemInstance = useCallback((sectionIndex: number, itemIndex: number, instanceIndex: number) => {
        setFormData(prev => {
            const newSections = JSON.parse(JSON.stringify(prev.sections));
            const item = newSections[sectionIndex].items[itemIndex];
            if (item.instances.length <= 1) return prev;
            
            const instanceId = `${item.id}-${instanceIndex}`;
            updateValidationErrors(instanceId, true); // Remove potential error

            item.instances.splice(instanceIndex, 1);
            return { ...prev, sections: newSections };
        });
    }, []);

    const handleToggleSection = useCallback((sectionIndex: number) => {
        setOpenSectionIndex(prevIndex => (prevIndex === sectionIndex ? null : sectionIndex));
    }, []);

    const displayedSections = useMemo(() => {
        if (!filterNotOK) return formData.sections;
        return formData.sections
            .map(section => ({
                ...section,
                items: section.items
                    .map(item => ({
                        ...item,
                        instances: item.instances.filter(instance => instance.status === 'Not OK'),
                    }))
                    .filter(item => item.instances.length > 0),
            }))
            .filter(section => section.items.length > 0);
    }, [formData.sections, filterNotOK]);

    const handleExportToPDF = async () => {
        if (!validateForm()) return;
    
        setIsExportingPdf(true);
        const originalFilterState = filterNotOK;
        setFilterNotOK(false);
        const originalOpenSection = openSectionIndex;
        setOpenSectionIndex(null); 
    
        setTimeout(async () => {
            const input = document.getElementById('app-container');
            if (!input) {
                console.error("Root element not found for PDF export");
                setIsExportingPdf(false);
                setFilterNotOK(originalFilterState);
                setOpenSectionIndex(originalOpenSection);
                return;
            }
    
            try {
                const canvas = await window.html2canvas(input, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const imgHeight = canvas.height * pdfWidth / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;
    
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
    
                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                    heightLeft -= pdf.internal.pageSize.getHeight();
                }
                
                const fileName = `Assessment_Report_${formData.header.areaLocation.replace(/\s/g, '_')}_${formData.header.assessmentDate}.pdf`;
                pdf.save(fileName);
            } catch (error) {
                console.error("Error exporting to PDF:", error);
                alert("Failed to export to PDF. Please try again.");
            } finally {
                setIsExportingPdf(false);
                setFilterNotOK(originalFilterState);
                setOpenSectionIndex(originalOpenSection);
            }
        }, 500);
    };

    const handleConfirmExportToEmail = () => {
        if (!validateForm()) {
            setIsEmailModalOpen(false);
            return;
        }
        setIsEmailModalOpen(false);
        
        const { header, sections, followUp } = formData;
        const subject = `Area Assessment Report - ${header.areaLocation} - ${header.assessmentDate}`;
        
        let body = `Area Assessment Report\n\n`;
        body += `Date: ${header.assessmentDate}\n`;
        body += `Area/Location: ${header.areaLocation}\n`;
        body += `Assessor: ${header.assessorName}\n\n`;
        body += `--------------------------------------\n\n`;
        body += `SUMMARY OF "NOT OK" ITEMS\n\n`;

        let hasNotOkItems = false;
        sections.forEach(section => {
            const notOkItems = section.items.flatMap(item => 
                item.instances.map((inst, idx) => ({ ...inst, text: item.text, id: item.id, isMulti: item.instances.length > 1, instanceIndex: idx }))
                .filter(inst => inst.status === 'Not OK')
            );
            if (notOkItems.length > 0) {
                hasNotOkItems = true;
                body += `SECTION: ${section.title}\n`;
                notOkItems.forEach(item => {
                    const itemText = item.isMulti ? `${item.text} #${item.instanceIndex + 1}` : item.text;
                    body += `- Item: ${itemText}\n`;
                    body += `  Description: ${item.description}\n\n`;
                });
            }
        });

        if (!hasNotOkItems) body += `No items with "Not OK" status.\n\n`;

        body += `--------------------------------------\n\n`;
        body += `NOTES & FOLLOW-UP\n\n`;
        body += `Summary: ${followUp.summary}\n`;
        body += `Recommendations: ${followUp.recommendations}\n`;
        body += `Person In Charge: ${followUp.personInCharge}\n`;
        body += `Target Completion Date: ${followUp.targetDate}\n`;

        window.location.href = `mailto:${emailRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleConfirmClear = () => {
        setFormData(getInitialFormData());
        setValidationErrors([]);
        setOpenSectionIndex(0);
        setFilterNotOK(false);
        setIsClearModalOpen(false);
    };

    return (
        <div id="app-container" className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">RDF Plant Risk Assessment Form</h1>
                        <p className="text-lg text-gray-600">PT Solusi Bangun Indonesia</p>
                    </div>
                    <div><img src={sbiLogoBase64} alt="Logo Solusi Bangun Indonesia" className="h-12 sm:h-16 w-auto" /></div>
                </header>

                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 border-b pb-4">General Information</h2>
                    <FormHeader data={formData.header} onChange={handleHeaderChange} />
                </div>
                
                <SummaryDashboard sections={formData.sections} filterOn={filterNotOK} onFilterToggle={setFilterNotOK} />

                {displayedSections.map((section, originalIndex) => (
                    <AssessmentSection
                        key={section.title}
                        section={section}
                        sectionIndex={formData.sections.findIndex(s => s.title === section.title)}
                        isOpen={openSectionIndex === formData.sections.findIndex(s => s.title === section.title) || openSectionIndex === null}
                        onToggle={() => handleToggleSection(formData.sections.findIndex(s => s.title === section.title))}
                        onStatusChange={handleStatusChange}
                        onDescriptionChange={handleDescriptionChange}
                        onPhotoChange={handlePhotoChange}
                        onAddItemInstance={handleAddItemInstance}
                        onRemoveItemInstance={handleRemoveItemInstance}
                        validationErrors={validationErrors}
                    />
                ))}

                <FollowUpSection data={formData.followUp} onChange={handleFollowUpChange} />
                
                <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <button onClick={() => setIsClearModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">Clear All</button>
                    <button onClick={() => setIsEmailModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Send Report</button>
                    <button onClick={handleExportToPDF} disabled={isExportingPdf} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed">
                        {isExportingPdf ? 'Exporting...' : 'Export to PDF'}
                    </button>
                </div>
            </div>

            <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)}>
                <div className="p-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Send Report via Email</h3>
                    <p className="mt-2 text-sm text-gray-500">Enter the recipient's email address. A summary of "Not OK" items and follow-up notes will be included in the email body.</p>
                    <div className="mt-4">
                        <label htmlFor="email-recipient" className="block text-sm font-medium text-gray-700">Recipient Email Address</label>
                        <input type="email" id="email-recipient" value={emailRecipient} onChange={(e) => setEmailRecipient(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" placeholder="recipient@example.com" />
                    </div>
                    <div className="mt-5 sm:mt-6 flex flex-wrap justify-end gap-3">
                        <button type="button" onClick={() => setIsEmailModalOpen(false)} className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50">Cancel</button>
                        <button type="button" onClick={handleConfirmExportToEmail} className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700">Send</button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)}>
                <div className="p-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Confirm Clear Form</h3>
                    <p className="mt-2 text-sm text-gray-500">Are you sure you want to clear all form data? This action cannot be undone.</p>
                    <div className="mt-5 sm:mt-6 flex flex-wrap justify-end gap-3">
                        <button type="button" onClick={() => setIsClearModalOpen(false)} className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50">Cancel</button>
                        <button type="button" onClick={handleConfirmClear} className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700">Clear Form</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default App;
