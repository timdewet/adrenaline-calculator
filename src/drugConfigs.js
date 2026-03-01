export const DRUGS = [
  {
    id: 'adrenaline',
    label: 'Adrenaline',
    ampLabel: '1 mg / 1 mL (1:1000)',
    ampUnitLabel: 'amp',
    mgPerAmp: 1,
    mcgPerAmp: 1000,
    doseUnit: 'mcg/kg/min',
    doseStep: 0.01,
    dosePlaceholder: '0.1',
    titrationSteps: [0.01, 0.02, 0.05, 0.1, 0.15, 0.2, 0.3, 0.5],
    centralAccess: {
      type: 'threshold',
      thresholdDose: 0.2,
      warningText:
        'Doses > 0.2 mcg/kg/min should be administered via a central venous catheter rather than a peripheral line.',
    },
  },
  {
    id: 'noradrenaline',
    label: 'Noradrenaline',
    ampLabel: '4 mg / 4 mL (1 mg/mL)',
    ampUnitLabel: 'amp',
    mgPerAmp: 4,
    mcgPerAmp: 4000,
    doseUnit: 'mcg/kg/min',
    doseStep: 0.01,
    dosePlaceholder: '0.1',
    titrationSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 1.0],
    centralAccess: {
      type: 'always',
      warningText:
        'Noradrenaline must always be administered via a central venous catheter. Peripheral administration risks severe tissue necrosis.',
    },
  },
  {
    id: 'dopamine',
    label: 'Dopamine',
    ampLabel: '40 mg / mL (200 mg / 5 mL vial)',
    ampUnitLabel: 'vial',
    mgPerAmp: 200,
    mcgPerAmp: 200000,
    doseUnit: 'mcg/kg/min',
    doseStep: 0.5,
    dosePlaceholder: '5',
    titrationSteps: [2, 2.5, 5, 7.5, 10, 12.5, 15, 20],
    centralAccess: {
      type: 'threshold',
      thresholdDose: 10,
      warningText:
        'Doses > 10 mcg/kg/min have predominantly alpha-adrenergic effects and should be administered via a central venous catheter.',
    },
  },
  {
    id: 'dobutamine',
    label: 'Dobutamine',
    ampLabel: '12.5 mg / mL (250 mg / 20 mL vial)',
    ampUnitLabel: 'vial',
    mgPerAmp: 250,
    mcgPerAmp: 250000,
    doseUnit: 'mcg/kg/min',
    doseStep: 0.5,
    dosePlaceholder: '5',
    titrationSteps: [2.5, 5, 7.5, 10, 12.5, 15, 20],
    centralAccess: {
      type: 'threshold',
      thresholdDose: 20,
      warningText:
        'High-dose dobutamine requires central venous access and haemodynamic monitoring.',
    },
  },
]
