import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { mockMSMEData } from '../mockData';

const CreditOSContext = createContext(null);

export function CreditOSProvider({ children }) {
  const [data, setData] = useState(() => JSON.parse(JSON.stringify(mockMSMEData)));
  const [uploadedFiles, setUploadedFiles] = useState({
    pl: null,
    bs: null,
    debtors: null,
    creditors: null,
    dprExcel: null
  });

  // DPR State
  const [dprInput, setDprInput] = useState(null);
  const [dprOutput, setDprOutput] = useState(null);
  const [parserValidation, setParserValidation] = useState(null);
  const [isDprGenerating, setIsDprGenerating] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (msg) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3500);
  };

  const updateProfile = (updatedProfile) => {
    setData((prev) => ({
      ...prev,
      businessProfile: {
        ...prev.businessProfile,
        ...updatedProfile
      }
    }));
  };

  const resetSession = () => {
    setData(JSON.parse(JSON.stringify(mockMSMEData)));
    setUploadedFiles({
      pl: null,
      bs: null,
      debtors: null,
      creditors: null,
      dprExcel: null
    });
    setDprInput(null);
    setDprOutput(null);
    setParserValidation(null);
    showToast('Session reset. Ready for new business assessment.');
  };

  const loadDemoData = () => {
    setData(JSON.parse(JSON.stringify(mockMSMEData)));
    setUploadedFiles({
      pl: { name: 'Apex_PL_Statement_FY25-26.xml', size: '142.4 KB' },
      bs: { name: 'Apex_Balance_Sheet_FY25-26.xml', size: '186.2 KB' },
      debtors: { name: 'Apex_Debtors_Ageing_Report.xlsx', size: '88.6 KB' },
      creditors: { name: 'Apex_Creditors_Ageing_Report.xlsx', size: '64.1 KB' },
      dprExcel: null
    });
  };

  const value = {
    data,
    setData,
    uploadedFiles,
    setUploadedFiles,
    updateProfile,
    resetSession,
    loadDemoData,
    toastMessage,
    showToast,

    // DPR Engine State & Setters
    dprInput,
    setDprInput,
    dprOutput,
    setDprOutput,
    parserValidation,
    setParserValidation,
    isDprGenerating,
    setIsDprGenerating
  };

  return (
    <CreditOSContext.Provider value={value}>
      {children}
    </CreditOSContext.Provider>
  );
}

export function useCreditOS() {
  const context = useContext(CreditOSContext);
  if (!context) {
    throw new Error('useCreditOS must be used within a CreditOSProvider');
  }
  return context;
}
