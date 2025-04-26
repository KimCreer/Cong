// data/hospitals.js
export const HOSPITALS = [
    // 🟨 Extensive Requirements (Gold)
    { 
      id: 1, 
      name: "Medical Center Muntinlupa (MCM)", 
      type: "extensive",
      logo: "https://images.squarespace-cdn.com/content/v1/607f6543f22402780bacd81a/1618961801816-H3TX55ECPKA1PE0GIHFR/MCM+%282%29.png?format=1500w",
      color: "#F75A5A",
      requirements: [
        "Clinical Abstract (In-Patients) / Medical Certificate (Outpatients)",
        "Certification of Unavailability",
        "Laboratory Results",
        "Social Case Study",
        "Valid ID",
        "Voter's ID",
        "Certificate of Indigency"
      ]
    },
    { 
      id: 2, 
      name: "Philippine Heart Center & PGH", 
      type: "extensive",
      logo: "https://owwamember.com/wp-content/uploads/2023/03/Philippine-Heart-Center-logo.png?x81179",
      color: "#F75A5A",
      requirements: [
        "Social Case Study",
        "Medical Certificate",
        "Quotation/Bill",
        "Valid ID",
        "Certificate of Indigency"
      ]
    },
    
    // 🟦 Standard Requirements (Blue)
    { 
      id: 3, 
      name: "NKTI", 
      type: "standard",
      logo: "https://wikiwandv2-19431.kxcdn.com/_next/image?url=https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/National_Kidney_and_Transplant_Institute_%2528NKTI%2529.svg/640px-National_Kidney_and_Transplant_Institute_%2528NKTI%2529.svg.png&w=640&q=50",
      color: "#F1BA88",
      requirements: [
        "Medical Certificate (within 3 months)",
        "Quotation/Bill (All Pages)",
        "Valid ID (Muntinlupa address)",
        "Voter's ID/COMELEC Certification",
        "Certificate of Indigency",
        "Authorization Letter (if needed)"
      ]
    },
    { 
      id: 4, 
      name: "Ospital ng Muntinlupa", 
      type: "standard",
      logo: "https://muntinlupacity.gov.ph/wp-content/uploads/2022/10/OSMUN.png",
      color: "#F1BA88",
      requirements: [
        "Medical Certificate",
        "Quotation/Bill",
        "Valid ID",
        "Barangay Certificate of Indigency"
      ]
    },
    
    // 🟫 DSWD Programs (Purple)
    { 
      id: 5, 
      name: "DSWD Medical Assistance", 
      type: "dswd-medical",
      logo: "https://vectorseek.com/wp-content/uploads/2023/08/Dswd-Logo-Vector.svg-.png",
      color: "#5E35B1",
      requirements: [
        "DSWD Prescribed Request Form",
        "Certificate of Indigency",
        "Medical Certificate/Abstract",
        "Prescription/Lab Request",
        "Unpaid Hospital Bill",
        "Social Case Study (for dialysis/cancer)"
      ]
    },
    { 
      id: 6, 
      name: "DSWD Burial Assistance", 
      type: "dswd-burial",
      logo: "https://scontent.fmnl33-5.fna.fbcdn.net/v/t1.15752-9/488081303_1704185153850186_7570965965417946860_n.png?_nc_cat=101&ccb=1-7&_nc_sid=9f807c&_nc_eui2=AeEY8-JC3wVomaNdM5n5RTKdUANsRh1c4utQA2xGHVzi64buyaGnvKz8GWZocYEmi9Hr7wwUgkBWLJsX2kC1nQWR&_nc_ohc=nw54fTrpf-QQ7kNvwGKVbC1&_nc_oc=AdmzmdbRW5l2Opud4MSKEDnkpJHHwU67YCu8E_yeEmfBL3lRcbNuHoCeLFDidqdO9H0&_nc_zt=23&_nc_ht=scontent.fmnl33-5.fna&oh=03_Q7cD2AF-ygYy2MNEwFfDdgOVwzfCStGCzBcxQ3cN5X96EwRUJw&oe=681BB960",
      color: "#5E35B1",
      requirements: [
        "Death Certificate",
        "Funeral Contract",
        "Promissory Note",
        "Valid ID of Claimant",
        "Certificate of Indigency"
      ]
    }
  ];