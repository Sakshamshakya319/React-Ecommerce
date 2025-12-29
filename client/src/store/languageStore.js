import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Language translations
const translations = {
  en: {
    // Navigation
    home: 'Home',
    products: 'Products',
    cart: 'Cart',
    login: 'Login',
    signup: 'Sign Up',
    profile: 'Profile',
    orders: 'Orders',
    logout: 'Logout',
    wishlist: 'Wishlist',
    
    // Home Page
    heroTitle: 'Experience Shopping in',
    heroSubtitle: 'New Reality',
    heroDescription: 'Revolutionize your online shopping experience with our cutting-edge product viewer. See, rotate, and customize products like never before.',
    exploreProducts: 'Explore Products',
    watchDemo: 'Watch Demo',
    
    // Features
    featuresTitle: 'Why Choose Our Store?',
    featuresSubtitle: 'We\'re transforming e-commerce with immersive technology that lets you experience products before you buy them.',
    
    feature1Title: 'Complete Product View',
    feature1Desc: 'Rotate, zoom, and examine products from every angle with our advanced viewer.',
    
    feature2Title: 'Real-time Customization',
    feature2Desc: 'Change colors, materials, and variants instantly to see exactly what you\'re buying.',
    
    feature3Title: 'Secure Shopping',
    feature3Desc: 'Shop with confidence using our secure payment system and buyer protection.',
    
    feature4Title: 'Fast Delivery',
    feature4Desc: 'Get your products delivered quickly with our reliable shipping partners.',
    
    // Seller Section
    becomeSellerTitle: 'Become a Seller',
    becomeSellerDesc: 'Join our marketplace and start selling your products with great visibility. Reach customers worldwide and grow your business.',
    sellerBenefit1: 'Upload images and details of your products',
    sellerBenefit2: 'Reach global customers',
    sellerBenefit3: 'Easy inventory management',
    sellerBenefit4: 'Secure payment processing',
    startSelling: 'Start Selling Today',
    activeSellers: 'Active Sellers',
    productsListed: 'Products Listed',
    totalSales: 'Total Sales',
    avgRating: 'Avg Rating',
    
    sellerTitle: 'Start Selling on Our Platform',
    sellerDescription: 'Join thousands of successful sellers and grow your business with our advanced e-commerce platform. Showcase your products beautifully and reach customers worldwide.',
    becomeSeller: 'Become a Seller',
    
    // CTA Section
    ctaTitle: 'Ready to Experience Modern Shopping?',
    ctaDescription: 'Join thousands of satisfied customers who have revolutionized their shopping experience with our advanced technology.',
    getStartedFree: 'Get Started Free',
    browseProducts: 'Browse Products',
    
    // Product Pages
    featuredProducts: 'Featured Products',
    noFeaturedProducts: 'No Featured Products',
    checkBackLater: 'Check back later for our featured products or browse all products.',
    browseAllProducts: 'Browse All Products',
    viewAllProducts: 'View All Products',
    discoverPopular: 'Discover our most popular items and latest products',
    
    // Product Cards
    outOfStock: 'Out of Stock',
    reviews: 'reviews',
    review: 'review',
    addToWishlist: 'Add to Wishlist',
    removeFromWishlist: 'Remove from Wishlist',
    pleaseLoginWishlist: 'Please login to add to wishlist',
    addedToWishlist: 'Added to wishlist',
    removedFromWishlist: 'Removed from wishlist',
    addedToCart: 'Added to cart!',
    failedToAddCart: 'Failed to add to cart',
    
    // Product Details
    productDetails: 'Product Details',
    specifications: 'Specifications',
    customerReviews: 'Customer Reviews',
    relatedProducts: 'Related Products',
    description: 'Description',
    brand: 'Brand',
    model: 'Model',
    color: 'Color',
    size: 'Size',
    weight: 'Weight',
    dimensions: 'Dimensions',
    material: 'Material',
    warranty: 'Warranty',
    inStock: 'In Stock',
    quantity: 'Quantity',
    selectQuantity: 'Select Quantity',
    
    // Cart Page
    shoppingCart: 'Shopping Cart',
    cartEmpty: 'Your cart is empty',
    continueShopping: 'Continue Shopping',
    removeItem: 'Remove Item',
    updateQuantity: 'Update Quantity',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    tax: 'Tax',
    total: 'Total',
    proceedToCheckout: 'Proceed to Checkout',
    freeShipping: 'Free Shipping',
    
    // Wishlist Page
    myWishlist: 'My Wishlist',
    wishlistEmpty: 'Your wishlist is empty',
    addSomeProducts: 'Add some products to your wishlist to see them here.',
    moveToCart: 'Move to Cart',
    
    // Profile Page
    myProfile: 'My Profile',
    accountSettings: 'Account Settings',
    personalInfo: 'Personal Information',
    changePassword: 'Change Password',
    downloadData: 'Download Data',
    deleteAccount: 'Delete Account',
    orderHistory: 'Order History',
    addresses: 'Addresses',
    preferences: 'Preferences',
    
    // Authentication
    emailAddress: 'Email Address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    newPassword: 'New Password',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember Me',
    dontHaveAccount: 'Don\'t have an account?',
    alreadyHaveAccount: 'Already have an account?',
    signInWithGoogle: 'Sign in with Google',
    createAccount: 'Create Account',
    
    // Common Actions
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    update: 'Update',
    submit: 'Submit',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    loading: 'Loading...',
    
    // Messages
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    
    // Common
    addToCart: 'Add to Cart',
    viewDetails: 'View Details',
    price: 'Price',
    category: 'Category',
    search: 'Search products...',
    currency: 'Currency',
    language: 'Language',
    
    // Admin
    adminPanel: 'Admin Panel',
    dashboard: 'Dashboard',
    customers: 'Customers',
    sellers: 'Sellers',
    
    // Seller
    sellerPanel: 'Seller Panel',
    myProducts: 'My Products',
    myOrders: 'My Orders',
    analytics: 'Analytics'
  },
  
  hi: {
    // Navigation
    home: 'होम',
    products: 'उत्पाद',
    cart: 'कार्ट',
    login: 'लॉगिन',
    signup: 'साइन अप',
    profile: 'प्रोफ़ाइल',
    orders: 'ऑर्डर',
    logout: 'लॉगआउट',
    wishlist: 'विशलिस्ट',
    
    // Home Page
    heroTitle: 'शॉपिंग का अनुभव करें',
    heroSubtitle: 'नई वास्तविकता में',
    heroDescription: 'हमारे अत्याधुनिक उत्पाद व्यूअर के साथ अपने ऑनलाइन शॉपिंग अनुभव में क्रांति लाएं। उत्पादों को देखें, घुमाएं और कस्टमाइज़ करें जैसा पहले कभी नहीं किया।',
    exploreProducts: 'उत्पाद देखें',
    watchDemo: 'डेमो देखें',
    
    // Features
    featuresTitle: 'हमारा स्टोर क्यों चुनें?',
    featuresSubtitle: 'हम इमर्सिव तकनीक के साथ ई-कॉमर्स को बदल रहे हैं जो आपको खरीदने से पहले उत्पादों का अनुभव करने देती है।',
    
    feature1Title: 'पूर्ण उत्पाद दृश्य',
    feature1Desc: 'हमारे उन्नत व्यूअर के साथ उत्पादों को हर कोण से घुमाएं, ज़ूम करें और जांचें।',
    
    feature2Title: 'रियल-टाइम कस्टमाइज़ेशन',
    feature2Desc: 'रंग, सामग्री और वेरिएंट को तुरंत बदलें और देखें कि आप वास्तव में क्या खरीद रहे हैं।',
    
    feature3Title: 'सुरक्षित शॉपिंग',
    feature3Desc: 'हमारे सुरक्षित भुगतान सिस्टम और खरीदार सुरक्षा के साथ विश्वास के साथ खरीदारी करें।',
    
    feature4Title: 'तेज़ डिलीवरी',
    feature4Desc: 'हमारे विश्वसनीय शिपिंग पार्टनर्स के साथ अपने उत्पादों को जल्दी डिलीवर कराएं।',
    
    // Seller Section
    becomeSellerTitle: 'विक्रेता बनें',
    becomeSellerDesc: 'हमारे मार्केटप्लेस में शामिल हों और बेहतरीन दृश्यता के साथ अपने उत्पाद बेचना शुरू करें। दुनिया भर के ग्राहकों तक पहुंचें और अपना व्यवसाय बढ़ाएं।',
    sellerBenefit1: 'अपने उत्पादों की छवियां और विवरण अपलोड करें',
    sellerBenefit2: 'वैश्विक ग्राहकों तक पहुंचें',
    sellerBenefit3: 'आसान इन्वेंटरी प्रबंधन',
    sellerBenefit4: 'सुरक्षित भुगतान प्रसंस्करण',
    startSelling: 'आज ही बेचना शुरू करें',
    activeSellers: 'सक्रिय विक्रेता',
    productsListed: 'सूचीबद्ध उत्पाद',
    totalSales: 'कुल बिक्री',
    avgRating: 'औसत रेटिंग',
    
    sellerTitle: 'हमारे प्लेटफॉर्म पर बेचना शुरू करें',
    sellerDescription: 'हजारों सफल विक्रेताओं के साथ जुड़ें और हमारे उन्नत ई-कॉमर्स प्लेटफॉर्म के साथ अपना व्यवसाय बढ़ाएं। अपने उत्पादों को सुंदर तरीके से प्रदर्शित करें और दुनिया भर के ग्राहकों तक पहुंचें।',
    becomeSeller: 'विक्रेता बनें',
    
    // CTA Section
    ctaTitle: 'आधुनिक शॉपिंग का अनुभव करने के लिए तैयार हैं?',
    ctaDescription: 'हजारों संतुष्ट ग्राहकों के साथ जुड़ें जिन्होंने हमारी उन्नत तकनीक के साथ अपने शॉपिंग अनुभव में क्रांति ला दी है।',
    getStartedFree: 'मुफ्त शुरुआत करें',
    browseProducts: 'उत्पाद ब्राउज़ करें',
    
    // Product Pages
    featuredProducts: 'फीचर्ड उत्पाद',
    noFeaturedProducts: 'कोई फीचर्ड उत्पाद नहीं',
    checkBackLater: 'हमारे फीचर्ड उत्पादों के लिए बाद में वापस आएं या सभी उत्पाद ब्राउज़ करें।',
    browseAllProducts: 'सभी उत्पाद ब्राउज़ करें',
    viewAllProducts: 'सभी उत्पाद देखें',
    discoverPopular: 'हमारे सबसे लोकप्रिय आइटम और नवीनतम उत्पादों की खोज करें',
    
    // Product Cards
    outOfStock: 'स्टॉक में नहीं',
    reviews: 'समीक्षाएं',
    review: 'समीक्षा',
    addToWishlist: 'विशलिस्ट में जोड़ें',
    removeFromWishlist: 'विशलिस्ट से हटाएं',
    pleaseLoginWishlist: 'विशलिस्ट में जोड़ने के लिए कृपया लॉगिन करें',
    addedToWishlist: 'विशलिस्ट में जोड़ा गया',
    removedFromWishlist: 'विशलिस्ट से हटाया गया',
    addedToCart: 'कार्ट में जोड़ा गया!',
    failedToAddCart: 'कार्ट में जोड़ने में विफल',
    
    // Product Details
    productDetails: 'उत्पाद विवरण',
    specifications: 'विशिष्टताएं',
    customerReviews: 'ग्राहक समीक्षाएं',
    relatedProducts: 'संबंधित उत्पाद',
    description: 'विवरण',
    brand: 'ब्रांड',
    model: 'मॉडल',
    color: 'रंग',
    size: 'आकार',
    weight: 'वजन',
    dimensions: 'आयाम',
    material: 'सामग्री',
    warranty: 'वारंटी',
    inStock: 'स्टॉक में',
    quantity: 'मात्रा',
    selectQuantity: 'मात्रा चुनें',
    
    // Cart Page
    shoppingCart: 'शॉपिंग कार्ट',
    cartEmpty: 'आपका कार्ट खाली है',
    continueShopping: 'खरीदारी जारी रखें',
    removeItem: 'आइटम हटाएं',
    updateQuantity: 'मात्रा अपडेट करें',
    subtotal: 'उप-योग',
    shipping: 'शिपिंग',
    tax: 'कर',
    total: 'कुल',
    proceedToCheckout: 'चेकआउट पर जाएं',
    freeShipping: 'मुफ्त शिपिंग',
    
    // Wishlist Page
    myWishlist: 'मेरी विशलिस्ट',
    wishlistEmpty: 'आपकी विशलिस्ट खाली है',
    addSomeProducts: 'यहां देखने के लिए अपनी विशलिस्ट में कुछ उत्पाद जोड़ें।',
    moveToCart: 'कार्ट में ले जाएं',
    
    // Profile Page
    myProfile: 'मेरी प्रोफ़ाइल',
    accountSettings: 'खाता सेटिंग्स',
    personalInfo: 'व्यक्तिगत जानकारी',
    changePassword: 'पासवर्ड बदलें',
    downloadData: 'डेटा डाउनलोड करें',
    deleteAccount: 'खाता हटाएं',
    orderHistory: 'ऑर्डर इतिहास',
    addresses: 'पते',
    preferences: 'प्राथमिकताएं',
    
    // Authentication
    emailAddress: 'ईमेल पता',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    newPassword: 'नया पासवर्ड',
    forgotPassword: 'पासवर्ड भूल गए?',
    rememberMe: 'मुझे याद रखें',
    dontHaveAccount: 'खाता नहीं है?',
    alreadyHaveAccount: 'पहले से खाता है?',
    signInWithGoogle: 'Google के साथ साइन इन करें',
    createAccount: 'खाता बनाएं',
    
    // Common Actions
    save: 'सेव करें',
    cancel: 'रद्द करें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    update: 'अपडेट करें',
    submit: 'सबमिट करें',
    confirm: 'पुष्टि करें',
    close: 'बंद करें',
    back: 'वापस',
    next: 'अगला',
    previous: 'पिछला',
    loading: 'लोड हो रहा है...',
    
    // Messages
    success: 'सफलता',
    error: 'त्रुटि',
    warning: 'चेतावनी',
    info: 'जानकारी',
    
    // Common
    addToCart: 'कार्ट में जोड़ें',
    viewDetails: 'विवरण देखें',
    price: 'मूल्य',
    category: 'श्रेणी',
    search: 'उत्पाद खोजें...',
    currency: 'मुद्रा',
    language: 'भाषा',
    
    // Admin
    adminPanel: 'एडमिन पैनल',
    dashboard: 'डैशबोर्ड',
    customers: 'ग्राहक',
    sellers: 'विक्रेता',
    
    // Seller
    sellerPanel: 'विक्रेता पैनल',
    myProducts: 'मेरे उत्पाद',
    myOrders: 'मेरे ऑर्डर',
    analytics: 'एनालिटिक्स'
  },
  
  te: {
    // Navigation
    home: 'హోమ్',
    products: 'ఉత్పత్తులు',
    cart: 'కార్ట్',
    login: 'లాగిన్',
    signup: 'సైన్ అప్',
    profile: 'ప్రొఫైల్',
    orders: 'ఆర్డర్లు',
    logout: 'లాగ్అవుట్',
    
    // Home Page
    heroTitle: 'షాపింగ్ అనుభవించండి',
    heroSubtitle: 'కొత్త రియాలిటీలో',
    heroDescription: 'మా అత్యాధునిక ప్రొడక్ట్ వ్యూయర్‌తో మీ ఆన్‌లైన్ షాపింగ్ అనుభవాన్ని విప్లవాత్మకంగా మార్చండి. ఉత్పత్తులను చూడండి, తిప్పండి మరియు కస్టమైజ్ చేయండి.',
    exploreProducts: 'ఉత్పత్తులను అన్వేషించండి',
    watchDemo: 'డెమో చూడండి',
    
    // Features
    featuresTitle: 'మా స్టోర్‌ను ఎందుకు ఎంచుకోవాలి?',
    featuresSubtitle: 'మేము ఇమ్మర్సివ్ టెక్నాలజీతో ఈ-కామర్స్‌ను మార్చుతున్నాము, ఇది మీరు కొనుగోలు చేయడానికి ముందు ఉత్పత్తులను అనుభవించడానికి అనుమతిస్తుంది.',
    
    feature1Title: 'పూర్తి ఉత్పత్తి వీక్షణ',
    feature1Desc: 'మా అధునాతన వ్యూయర్‌తో ఉత్పత్తులను ప్రతి కోణం నుండి తిప్పండి, జూమ్ చేయండి మరియు పరిశీలించండి.',
    
    feature2Title: 'రియల్-టైమ్ కస్టమైజేషన్',
    feature2Desc: 'రంగులు, మెటీరియల్స్ మరియు వేరియంట్లను తక్షణమే మార్చండి మరియు మీరు ఖచ్చితంగా ఏమి కొనుగోలు చేస్తున్నారో చూడండి.',
    
    feature3Title: 'సురక్షిత షాపింగ్',
    feature3Desc: 'మా సురక్షిత చెల్లింపు వ్యవస్థ మరియు కొనుగోలుదారు రక్షణతో విశ్వాసంతో షాపింగ్ చేయండి.',
    
    feature4Title: 'వేగవంతమైన డెలివరీ',
    feature4Desc: 'మా విశ్వసనీయ షిప్పింగ్ భాగస్వాములతో మీ ఉత్పత్తులను త్వరగా డెలివరీ చేయించుకోండి.',
    
    // Seller Section
    sellerTitle: 'మా ప్లాట్‌ఫారమ్‌లో అమ్మకాలు ప్రారంభించండి',
    sellerDescription: 'వేలాది విజయవంతమైన విక్రేతలతో చేరండి మరియు మా అధునాతన ఈ-కామర్స్ ప్లాట్‌ఫారమ్‌తో మీ వ్యాపారాన్ని పెంచుకోండి.',
    becomeSeller: 'విక్రేత అవ్వండి',
    
    // CTA Section
    ctaTitle: 'ఆధునిక షాపింగ్ అనుభవించడానికి సిద్ధంగా ఉన్నారా?',
    ctaDescription: 'మా అధునాతన టెక్నాలజీతో తమ షాపింగ్ అనుభవాన్ని విప్లవాత్మకంగా మార్చుకున్న వేలాది సంతృప్త కస్టమర్లతో చేరండి.',
    getStartedFree: 'ఉచితంగా ప్రారంభించండి',
    browseProducts: 'ఉత్పత్తులను బ్రౌజ్ చేయండి',
    
    // Common
    addToCart: 'కార్ట్‌కు జోడించండి',
    viewDetails: 'వివరాలు చూడండి',
    price: 'ధర',
    category: 'వర్గం',
    search: 'ఉత్పత్తులను వెతకండి...',
    currency: 'కరెన్సీ',
    language: 'భాష',
    
    // Admin
    adminPanel: 'అడ్మిన్ ప్యానెల్',
    dashboard: 'డాష్‌బోర్డ్',
    customers: 'కస్టమర్లు',
    sellers: 'విక్రేతలు',
    
    // Seller
    sellerPanel: 'విక్రేత ప్యానెల్',
    myProducts: 'నా ఉత్పత్తులు',
    myOrders: 'నా ఆర్డర్లు',
    analytics: 'అనలిటిక్స్'
  },
  
  ta: {
    // Navigation
    home: 'முகப்பு',
    products: 'தயாரிப்புகள்',
    cart: 'கார்ட்',
    login: 'உள்நுழைவு',
    signup: 'பதிவு செய்யவும்',
    profile: 'சுயவிவரம்',
    orders: 'ஆர்டர்கள்',
    logout: 'வெளியேறு',
    
    // Home Page
    heroTitle: 'ஷாப்பிங்கை அனுபவிக்கவும்',
    heroSubtitle: 'புதிய ரியாலிட்டியில்',
    heroDescription: 'எங்கள் அதிநவீன தயாரிப்பு பார்வையாளருடன் உங்கள் ஆன்லைன் ஷாப்பிங் அனுபவத்தை புரட்சிகரமாக மாற்றுங்கள். தயாரிப்புகளைப் பார்க்கவும், சுழற்றவும் மற்றும் தனிப்பயனாக்கவும்.',
    exploreProducts: 'தயாரிப்புகளை ஆராயுங்கள்',
    watchDemo: 'டெமோ பார்க்கவும்',
    
    // Features
    featuresTitle: 'எங்கள் ஸ்டோரை ஏன் தேர்வு செய்ய வேண்டும்?',
    featuresSubtitle: 'நீங்கள் வாங்குவதற்கு முன்பு தயாரிப்புகளை அனுபவிக்க அனுமதிக்கும் அமுக்கும் தொழில்நுட்பத்துடன் மின்-வணிகத்தை மாற்றுகிறோம்.',
    
    feature1Title: 'முழுமையான தயாரிப்பு பார்வை',
    feature1Desc: 'எங்கள் மேம்பட்ட பார்வையாளருடன் தயாரிப்புகளை ஒவ்வொரு கோணத்திலிருந்தும் சுழற்றவும், பெரிதாக்கவும் மற்றும் ஆராயவும்.',
    
    feature2Title: 'நிகழ்நேர தனிப்பயனாக்கம்',
    feature2Desc: 'நிறங்கள், பொருட்கள் மற்றும் மாறுபாடுகளை உடனடியாக மாற்றி, நீங்கள் சரியாக என்ன வாங்குகிறீர்கள் என்பதைப் பார்க்கவும்.',
    
    feature3Title: 'பாதுகாப்பான ஷாப்பிங்',
    feature3Desc: 'எங்கள் பாதுகாப்பான கட்டண முறை மற்றும் வாங்குபவர் பாதுகாப்பைப் பயன்படுத்தி நம்பிக்கையுடன் ஷாப்பிங் செய்யுங்கள்.',
    
    feature4Title: 'வேகமான டெலிவரி',
    feature4Desc: 'எங்கள் நம்பகமான ஷிப்பிங் பார்ட்னர்களுடன் உங்கள் தயாரிப்புகளை விரைவாக டெலிவரி செய்யுங்கள்.',
    
    // Seller Section
    sellerTitle: 'எங்கள் தளத்தில் விற்பனையைத் தொடங்குங்கள்',
    sellerDescription: 'ஆயிரக்கணக்கான வெற்றிகரமான விற்பனையாளர்களுடன் சேர்ந்து எங்கள் மேம்பட்ட மின்-வணிக தளத்துடன் உங்கள் வணிகத்தை வளர்க்கவும்.',
    becomeSeller: 'விற்பனையாளராக மாறுங்கள்',
    
    // CTA Section
    ctaTitle: 'நவீன ஷாப்பிங்கை அனுபவிக்க தயாரா?',
    ctaDescription: 'எங்கள் மேம்பட்ட தொழில்நுட்பத்துடன் தங்கள் ஷாப்பிங் அனுபவத்தை புரட்சிகரமாக மாற்றிய ஆயிரக்கணக்கான திருப்தியான வாடிக்கையாளர்களுடன் சேருங்கள்.',
    getStartedFree: 'இலவசமாக தொடங்குங்கள்',
    browseProducts: 'தயாரிப்புகளை உலாவுங்கள்',
    
    // Common
    addToCart: 'கார்ட்டில் சேர்க்கவும்',
    viewDetails: 'விவரங்களைப் பார்க்கவும்',
    price: 'விலை',
    category: 'வகை',
    search: 'தயாரிப்புகளைத் தேடுங்கள்...',
    currency: 'நாணயம்',
    language: 'மொழி',
    
    // Admin
    adminPanel: 'நிர்வாக பேனல்',
    dashboard: 'டாஷ்போர்டு',
    customers: 'வாடிக்கையாளர்கள்',
    sellers: 'விற்பனையாளர்கள்',
    
    // Seller
    sellerPanel: 'விற்பனையாளர் பேனல்',
    myProducts: 'எனது தயாரிப்புகள்',
    myOrders: 'எனது ஆர்டர்கள்',
    analytics: 'பகுப்பாய்வு'
  },
  
  mr: {
    // Navigation
    home: 'होम',
    products: 'उत्पादने',
    cart: 'कार्ट',
    login: 'लॉगिन',
    signup: 'साइन अप',
    profile: 'प्रोफाइल',
    orders: 'ऑर्डर',
    logout: 'लॉगआउट',
    
    // Home Page
    heroTitle: 'शॉपिंगचा अनुभव घ्या',
    heroSubtitle: 'नवीन रिअॅलिटीमध्ये',
    heroDescription: 'आमच्या अत्याधुनिक उत्पादन दर्शकासह तुमचा ऑनलाइन शॉपिंग अनुभव क्रांतिकारक बनवा. उत्पादने पहा, फिरवा आणि कस्टमाइझ करा.',
    exploreProducts: 'उत्पादने एक्सप्लोर करा',
    watchDemo: 'डेमो पहा',
    
    // Features
    featuresTitle: 'आमचे स्टोअर का निवडावे?',
    featuresSubtitle: 'आम्ही इमर्सिव्ह तंत्रज्ञानासह ई-कॉमर्स बदलत आहोत जे तुम्हाला खरेदी करण्यापूर्वी उत्पादनांचा अनुभव घेऊ देते.',
    
    feature1Title: 'पूर्ण उत्पादन दृश्य',
    feature1Desc: 'आमच्या प्रगत दर्शकासह उत्पादने प्रत्येक कोनातून फिरवा, झूम करा आणि तपासा.',
    
    feature2Title: 'रिअल-टाइम कस्टमायझेशन',
    feature2Desc: 'रंग, साहित्य आणि व्हेरिएंट्स त्वरित बदला आणि तुम्ही नक्की काय खरेदी करत आहात ते पहा.',
    
    feature3Title: 'सुरक्षित शॉपिंग',
    feature3Desc: 'आमच्या सुरक्षित पेमेंट सिस्टम आणि खरेदीदार संरक्षणासह विश्वासाने शॉपिंग करा.',
    
    feature4Title: 'जलद डिलिव्हरी',
    feature4Desc: 'आमच्या विश्वसनीय शिपिंग भागीदारांसह तुमची उत्पादने लवकर डिलिव्हर करा.',
    
    // Seller Section
    sellerTitle: 'आमच्या प्लॅटफॉर्मवर विक्री सुरू करा',
    sellerDescription: 'हजारो यशस्वी विक्रेत्यांसह सामील व्हा आणि आमच्या प्रगत ई-कॉमर्स प्लॅटफॉर्मसह तुमचा व्यवसाय वाढवा.',
    becomeSeller: 'विक्रेता बना',
    
    // CTA Section
    ctaTitle: 'आधुनिक शॉपिंगचा अनुभव घेण्यास तयार आहात?',
    ctaDescription: 'आमच्या प्रगत तंत्रज्ञानासह त्यांचा शॉपिंग अनुभव क्रांतिकारक बनवलेल्या हजारो समाधानी ग्राहकांसह सामील व्हा.',
    getStartedFree: 'मोफत सुरुवात करा',
    browseProducts: 'उत्पादने ब्राउझ करा',
    
    // Common
    addToCart: 'कार्टमध्ये जोडा',
    viewDetails: 'तपशील पहा',
    price: 'किंमत',
    category: 'श्रेणी',
    search: 'उत्पादने शोधा...',
    currency: 'चलन',
    language: 'भाषा',
    
    // Admin
    adminPanel: 'अॅडमिन पॅनेल',
    dashboard: 'डॅशबोर्ड',
    customers: 'ग्राहक',
    sellers: 'विक्रेते',
    
    // Seller
    sellerPanel: 'विक्रेता पॅनेल',
    myProducts: 'माझी उत्पादने',
    myOrders: 'माझे ऑर्डर',
    analytics: 'अॅनालिटिक्स'
  }
}

export const useLanguageStore = create(
  persist(
    (set, get) => ({
      // State
      currentLanguage: 'en',
      
      // Available languages
      languages: [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
        { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
        { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
        { code: 'mr', name: 'Marathi', nativeName: 'मराठी' }
      ],
      
      // Actions
      setLanguage: (languageCode) => {
        set({ currentLanguage: languageCode })
      },
      
      // Get translation function
      t: (key) => {
        const { currentLanguage } = get()
        return translations[currentLanguage]?.[key] || translations.en[key] || key
      },
      
      // Get current language info
      getCurrentLanguage: () => {
        const { currentLanguage, languages } = get()
        return languages.find(lang => lang.code === currentLanguage) || languages[0]
      }
    }),
    {
      name: 'language-storage',
      partialize: (state) => ({
        currentLanguage: state.currentLanguage
      })
    }
  )
)