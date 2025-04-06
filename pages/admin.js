const adminContent = document.getElementById('admin-content');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const nannyList = document.getElementById('nannies-ul');

// Firebase references (initialized in admin.html)
let db;
let storage;

// Mock data for offline mode
const mockNannies = [
    {
        id: 'mock1',
        name: 'Jane Smith (Mock)',
        experience: 5,
        availability: 'Full-time',
        languages: ['English', 'Spanish'],
        bio: 'Experienced nanny with 5 years of childcare experience. (This is mock data - Firebase is unavailable)',
        photo: '../images/nanny1.jpg'
    },
    {
        id: 'mock2',
        name: 'Maria Rodriguez (Mock)',
        experience: 8,
        availability: 'Part-time',
        languages: ['English', 'Spanish', 'French'],
        bio: 'Loving and caring nanny with 8 years of experience. (This is mock data - Firebase is unavailable)',
        photo: '../images/nanny2.jpg'
    },
    {
        id: 'mock3',
        name: 'Sarah Johnson (Mock)',
        experience: 3,
        availability: 'Weekends Only',
        languages: ['English'],
        bio: 'Energetic nanny who loves outdoor activities. (This is mock data - Firebase is unavailable)',
        photo: '../images/nanny3.jpg'
    }
];

// Flag to track if we're in offline mode
let isOfflineMode = false;

// Initialize Firebase and Firestore
function initFirebase() {
    try {
        // Update Firebase status indicator
        updateFirebaseStatus('connecting', 'Initializing Firebase...');

        // Check if Firebase is ready (set in admin.html)
        if (window.firebaseReady) {
            // Get Firebase references from the global window object
            db = window.firebaseDb;
            storage = window.firebaseStorage;

            console.log('Firebase initialized successfully');

            // Update Firebase status indicator
            updateFirebaseStatus('connecting', 'Testing Firebase connectivity...');

            // Test Firebase connectivity with a timeout
            const connectivityTimeout = setTimeout(() => {
                console.warn('Firebase connectivity test timed out after 5 seconds');
                updateFirebaseStatus('error', 'Firebase connectivity test timed out');
                enableOfflineMode();
            }, 5000);

            // Test connectivity and clear timeout if successful
            testFirebaseConnectivity().then(() => {
                clearTimeout(connectivityTimeout);
                updateFirebaseStatus('connected', 'Connected to Firebase');
            }).catch(error => {
                clearTimeout(connectivityTimeout);
                console.error('Firebase connectivity test failed:', error);
                updateFirebaseStatus('error', 'Firebase connectivity test failed: ' + error.message);
                enableOfflineMode();
            });
        } else {
            // If Firebase is not ready yet, wait for it (with a maximum number of retries)
            if (!window.firebaseInitRetries) {
                window.firebaseInitRetries = 0;
            }

            if (window.firebaseInitRetries < 10) { // Maximum 10 retries (5 seconds)
                console.log(`Firebase not ready yet, waiting... (attempt ${window.firebaseInitRetries + 1}/10)`);
                window.firebaseInitRetries++;
                setTimeout(initFirebase, 500); // Try again in 500ms
            } else {
                console.error('Firebase failed to initialize after multiple attempts');
                alert('Firebase failed to initialize after multiple attempts. The application will work in offline mode.');
                enableOfflineMode();
            }
        }
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        alert('Error initializing Firebase: ' + error.message + '\n\nSwitching to offline mode with mock data.');
        enableOfflineMode();
    }
}

// Test if Firebase is actually accessible
async function testFirebaseConnectivity() {
    try {
        // First, check if we can access the Firestore database
        if (!db) {
            throw new Error('Firestore database reference is not available');
        }

        // Try a simple read operation first (less likely to fail due to permissions)
        try {
            console.log('Testing Firebase connectivity with read operation...');
            const testCollection = window.firebaseCollection(db, '_test_');
            const testDoc = window.firebaseDoc(testCollection, 'test');
            await window.firebaseGetDoc(testDoc);
            console.log('Firebase read operation successful');
        } catch (readError) {
            console.warn('Firebase read test failed, trying write operation:', readError);
            // If read fails, try a write operation
            const testCollection = window.firebaseCollection(db, '_test_');
            const testDoc = window.firebaseDoc(testCollection, 'test');
            await window.firebaseSetDoc(testDoc, { timestamp: new Date().toISOString() }, { merge: true });
            console.log('Firebase write operation successful');
        }

        // If we got here, Firebase is accessible
        isOfflineMode = false;
        console.log('Firebase connectivity confirmed');

        // Also check Storage connectivity
        try {
            console.log('Testing Firebase Storage connectivity...');
            const storageRef = window.firebaseStorageRef(storage, '_test_/test.txt');
            const testBlob = new Blob(['test'], { type: 'text/plain' });

            // Set a timeout for the upload operation
            const uploadPromise = window.firebaseUploadBytes(storageRef, testBlob);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Upload timed out after 5 seconds')), 5000)
            );

            await Promise.race([uploadPromise, timeoutPromise]);
            console.log('Firebase Storage connectivity confirmed');
            window.firebaseCorsConfigured = true;
        } catch (storageError) {
            console.warn('Firebase Storage connectivity test failed:', storageError);
            if (storageError.code === 'storage/cors-unsupported') {
                console.error('CORS is not configured for Firebase Storage');
                window.firebaseCorsConfigured = false;
            } else {
                // Other storage errors might not be CORS-related
                window.firebaseCorsConfigured = false;
            }
        }

        return true;
    } catch (error) {
        console.error('Firebase connectivity test failed:', error);
        enableOfflineMode();

        // Provide more specific error messages
        if (error.code === 'permission-denied') {
            console.error('Firebase permission denied. Check your security rules.');
        } else if (error.code === 'unavailable') {
            console.error('Firebase is unavailable. Check your internet connection.');
        } else if (error.code === 'not-found') {
            console.error('Firebase project not found. Check your Firebase configuration.');
        }

        throw error; // Re-throw to be caught by the caller
    }
}

// Enable offline mode with mock data
function enableOfflineMode() {
    isOfflineMode = true;
    console.log('Switching to offline mode with mock data');

    // Update Firebase status indicator
    updateFirebaseStatus('offline', 'Offline mode enabled, using mock data');

    // Add an offline indicator to the UI
    const offlineIndicator = document.createElement('div');
    offlineIndicator.id = 'offline-indicator';
    offlineIndicator.style.backgroundColor = '#ff9800';
    offlineIndicator.style.color = 'white';
    offlineIndicator.style.padding = '10px';
    offlineIndicator.style.textAlign = 'center';
    offlineIndicator.style.position = 'fixed';
    offlineIndicator.style.top = '0';
    offlineIndicator.style.left = '0';
    offlineIndicator.style.right = '0';
    offlineIndicator.style.zIndex = '1000';
    offlineIndicator.innerHTML = '<strong>OFFLINE MODE</strong> - Using mock data. Firebase is unavailable.';

    // Add the indicator to the body if it doesn't already exist
    if (!document.getElementById('offline-indicator')) {
        document.body.prepend(offlineIndicator);
    }
}

// Update the Firebase status indicator
function updateFirebaseStatus(status, message) {
    const statusElement = document.getElementById('firebase-status');
    const statusTextElement = document.getElementById('firebase-status-text');

    if (!statusElement || !statusTextElement) {
        console.warn('Firebase status elements not found');
        return;
    }

    // Show the status element
    statusElement.style.display = 'block';

    // Update the status text
    statusTextElement.textContent = message;

    // Update the status color
    switch (status) {
        case 'connecting':
            statusElement.style.backgroundColor = '#FFF3CD'; // Yellow
            statusElement.style.color = '#856404';
            break;
        case 'connected':
            statusElement.style.backgroundColor = '#D4EDDA'; // Green
            statusElement.style.color = '#155724';
            // Hide the status after 5 seconds
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 5000);
            break;
        case 'error':
            statusElement.style.backgroundColor = '#F8D7DA'; // Red
            statusElement.style.color = '#721C24';
            break;
        case 'offline':
            statusElement.style.backgroundColor = '#D6D8D9'; // Gray
            statusElement.style.color = '#1B1E21';
            break;
        default:
            statusElement.style.backgroundColor = '#E2E3E5'; // Default gray
            statusElement.style.color = '#383D41';
    }
}

// Function to display nannies in the list
function displayNannies(nannies) {
    nannyList.innerHTML = ''; // Clear the list
    nannies.forEach(nanny => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${nanny.name} - ${nanny.experience} years
            <button onclick="editNanny('${nanny.id}')">Edit</button>
            <button onclick="deleteNanny('${nanny.id}')">Delete</button>
        `;
        nannyList.appendChild(li);
    });
}

// Function to fetch nannies from Firestore or mock data
async function fetchNannies() {
    try {
        if (isOfflineMode) {
            // Use mock data in offline mode
            console.log('Using mock nannies data in offline mode');
            displayNannies(mockNannies);
            return;
        }

        // Try to fetch from Firebase if online using the modular SDK
        const nanniesCollection = window.firebaseCollection(db, 'nannies');
        const snapshot = await window.firebaseGetDocs(nanniesCollection);
        const nannies = [];

        snapshot.forEach(doc => {
            nannies.push({ id: doc.id, ...doc.data() });
        });

        if (nannies.length === 0) {
            // If no nannies found in Firebase, use mock data
            console.log('No nannies found in Firebase, using mock data');
            displayNannies(mockNannies);
        } else {
            displayNannies(nannies);
        }
    } catch (error) {
        console.error('Error fetching nannies:', error);

        // Switch to offline mode if not already
        if (!isOfflineMode) {
            alert('Error fetching nannies: ' + error.message + '\n\nSwitching to offline mode with mock data.');
            enableOfflineMode();
            displayNannies(mockNannies);
        } else {
            displayNannies(mockNannies);
        }
    }
}

// Function to verify Firebase project configuration
async function verifyFirebaseProject() {
    try {
        // Try to access a known Firebase service to verify project exists
        const projectId = window.firebaseApp.options.projectId;
        console.log('Verifying Firebase project:', projectId);

        // Create a simple test document to verify write access
        const testCollection = window.firebaseCollection(db, '_test_connection');
        const testDoc = window.firebaseDoc(testCollection, 'test');
        await window.firebaseUpdateDoc(testDoc, { timestamp: window.firebaseServerTimestamp() });
        console.log('Firebase project verification successful');
        return true;
    } catch (error) {
        console.error('Firebase project verification failed:', error);
        alert('Firebase project verification failed: ' + error.message + '\n\nPossible issues:\n1. The Firebase project may be deleted or disabled\n2. Your internet connection may be down\n3. The API key may have restrictions');
        return false;
    }
}

// Function to handle login
async function login() {
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (username === 'admin' && password === 'admin') {
        // Successful login
        loginForm.style.display = 'none';
        adminContent.style.display = 'block';

        try {
            // Check if we're already in offline mode
            if (isOfflineMode) {
                console.log('Already in offline mode, using mock data');
                displayNannies(mockNannies);
                return;
            }

            // Verify Firebase project before fetching nannies
            const isProjectValid = await verifyFirebaseProject();
            if (isProjectValid) {
                fetchNannies();
            } else {
                // If project verification failed, switch to offline mode
                enableOfflineMode();
                displayNannies(mockNannies);
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('Error connecting to Firebase: ' + error.message + '\n\nSwitching to offline mode with mock data.');
            enableOfflineMode();
            displayNannies(mockNannies);
        }
    } else {
        alert('Invalid credentials');
    }
}

// Function to handle logout
function logout() {
    adminContent.style.display = 'none';
    loginForm.style.display = 'block';
}

// Function to handle saving a nanny
async function saveNanny() {
    const name = document.getElementById('nanny-name').value;
    const photoInput = document.getElementById('nanny-photo');
    const experience = document.getElementById('nanny-experience').value;
    const availability = document.getElementById('nanny-availability').value;
    const languagesSelect = document.getElementById('nanny-languages');
    const bio = document.getElementById('nanny-bio').value;

    if (!name || !experience || !availability) {
        alert('Please fill in all required fields.');
        return;
    }

    const languages = Array.from(languagesSelect.selectedOptions).map(option => option.value);

    // Function to clear the form
    const clearForm = () => {
        document.getElementById('nanny-name').value = '';
        photoInput.value = '';
        document.getElementById('nanny-experience').value = '';
        document.getElementById('nanny-availability').selectedIndex = 0;
        for (let i = 0; i < languagesSelect.options.length; i++) {
            languagesSelect.options[i].selected = false;
        }
        document.getElementById('nanny-bio').value = '';
    };

    // Check if in offline mode
    if (isOfflineMode) {
        // Add to mock data in offline mode
        const newNanny = {
            id: 'mock' + (mockNannies.length + 1),
            name: name + ' (Mock)',
            experience: experience,
            availability: availability,
            languages: languages,
            bio: bio + ' (This is mock data - Firebase is unavailable)',
            photo: photoInput.files.length > 0 ? URL.createObjectURL(photoInput.files[0]) : '../images/default-nanny.jpg'
        };

        mockNannies.push(newNanny);
        alert('Nanny added successfully in offline mode! (Note: This data will be lost when you refresh the page)');

        // Clear the form
        clearForm();

        // Refresh the nanny list
        displayNannies(mockNannies);
        return;
    }

    // If online, proceed with Firebase storage
    const photo = photoInput.files[0];

    try {
        let photoUrl = '../images/default-nanny.jpg';

        if (photo) {
            // Always create a data URL as a fallback
            let dataUrl = '../images/default-nanny.jpg';
            try {
                const reader = new FileReader();
                const dataUrlPromise = new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                });
                reader.readAsDataURL(photo);
                dataUrl = await dataUrlPromise;
                console.log('Data URL created successfully');
            } catch (dataUrlError) {
                console.error('Error creating data URL:', dataUrlError);
            }

            // Set the photoUrl to the data URL as a fallback
            photoUrl = dataUrl;

            // Try Firebase Storage upload if authenticated and CORS is configured
            const isAuthenticated = window.firebaseAuthenticated === true;
            const isCorsConfigured = window.firebaseCorsConfigured === true;
            if (isAuthenticated && isCorsConfigured) {
                try {
                    // Generate a unique filename to prevent overwriting
                    const timestamp = new Date().getTime();
                    const uniqueFilename = `${timestamp}_${photo.name}`;

                    // Use modular Firebase Storage SDK
                    const storageRef = window.firebaseStorageRef(storage, `images/${uniqueFilename}`);

                    // Set a timeout for the upload operation
                    const uploadPromise = window.firebaseUploadBytes(storageRef, photo);
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Upload timed out after 5 seconds')), 5000)
                    );

                    // Race the upload against the timeout
                    console.log('Uploading photo to Firebase Storage...');
                    await Promise.race([uploadPromise, timeoutPromise]);

                    // If we get here, the upload succeeded, so get the download URL
                    console.log('Photo uploaded successfully, getting download URL...');
                    const urlPromise = window.firebaseGetDownloadURL(storageRef);
                    const urlTimeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Getting URL timed out after 5 seconds')), 5000)
                    );

                    // Race the URL retrieval against the timeout
                    const firebaseUrl = await Promise.race([urlPromise, urlTimeoutPromise]);
                    console.log('Firebase URL obtained:', firebaseUrl);

                    // Use the Firebase URL instead of the data URL
                    photoUrl = firebaseUrl;
                } catch (error) {
                    console.error('Error with Firebase Storage:', error);
                    console.log('Using data URL as fallback');
                    // Keep using the data URL (already set above)
                }
            } else {
                if (!isAuthenticated) {
                    console.warn('Not authenticated for Storage operations, using data URL');
                }
                if (!isCorsConfigured) {
                    console.warn('CORS not configured for Firebase Storage, using data URL');
                }
                // Keep using the data URL (already set above)
            }
        }

        // Add the nanny to Firestore
        console.log('Adding nanny to Firestore...');
        const nanniesCollection = window.firebaseCollection(db, 'nannies');
        await window.firebaseAddDoc(nanniesCollection, {
            name: name,
            photo: photoUrl,
            experience: experience,
            availability: availability,
            languages: languages,
            bio: bio,
            createdAt: window.firebaseServerTimestamp()
        });

        alert('Nanny added successfully!');
        clearForm();
        fetchNannies();
    } catch (error) {
        console.error('Error in saveNanny:', error);

        // Try to add the nanny without the image
        try {
            console.log('Attempting to add nanny without image...');
            const nanniesCollection = window.firebaseCollection(db, 'nannies');
            await window.firebaseAddDoc(nanniesCollection, {
                name: name,
                photo: '../images/default-nanny.jpg',
                experience: experience,
                availability: availability,
                languages: languages,
                bio: bio,
                createdAt: window.firebaseServerTimestamp()
            });

            alert('Nanny added successfully (with default image)!');
            clearForm();
            fetchNannies();
        } catch (innerError) {
            console.error('Error adding nanny without image:', innerError);
            alert('Error saving nanny: ' + innerError.message + '\n\nSwitching to offline mode.');
            enableOfflineMode();
            saveNanny(); // Try again in offline mode
        }
    }
}

// Function to handle editing a nanny
async function editNanny(nannyId) {
    const name = document.getElementById('nanny-name').value;
    const photoInput = document.getElementById('nanny-photo');
    const experience = document.getElementById('nanny-experience').value;
    const availability = document.getElementById('nanny-availability').value;
    const languagesSelect = document.getElementById('nanny-languages');
    const bio = document.getElementById('nanny-bio').value;

    // Get selected languages
    const languages = Array.from(languagesSelect.selectedOptions).map(option => option.value);

    // Function to clear the form
    const clearForm = () => {
        document.getElementById('nanny-name').value = '';
        photoInput.value = '';
        document.getElementById('nanny-experience').value = '';
        document.getElementById('nanny-availability').selectedIndex = 0;
        for (let i = 0; i < languagesSelect.options.length; i++) {
            languagesSelect.options[i].selected = false;
        }
        document.getElementById('nanny-bio').value = '';
    };

    // Check if in offline mode
    if (isOfflineMode) {
        // Find and update the mock nanny
        const mockIndex = mockNannies.findIndex(nanny => nanny.id === nannyId);
        if (mockIndex !== -1) {
            mockNannies[mockIndex] = {
                ...mockNannies[mockIndex],
                name: name + ' (Mock)',
                experience: experience,
                availability: availability,
                languages: languages,
                bio: bio + ' (This is mock data - Firebase is unavailable)',
                photo: photoInput.files.length > 0 ? URL.createObjectURL(photoInput.files[0]) : mockNannies[mockIndex].photo
            };

            alert('Nanny updated successfully in offline mode! (Note: This data will be lost when you refresh the page)');
            clearForm();
            displayNannies(mockNannies);
        } else {
            alert('Error: Could not find nanny with ID ' + nannyId + ' in offline mode.');
        }
        return;
    }

    // If online, proceed with Firebase
    const photo = photoInput.files[0];

    try {
        let photoUrl = null; // null means don't update the photo

        if (photo) {
            // Always create a data URL as a fallback
            try {
                const reader = new FileReader();
                const dataUrlPromise = new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                });
                reader.readAsDataURL(photo);
                const dataUrl = await dataUrlPromise;
                console.log('Data URL created successfully');

                // Set the photoUrl to the data URL
                photoUrl = dataUrl;
            } catch (dataUrlError) {
                console.error('Error creating data URL:', dataUrlError);
                alert(`Error processing image: ${dataUrlError.message}\n\nThe nanny will be updated without changing the image.`);
                photoUrl = null; // Don't update the photo
            }

            // Try Firebase Storage upload if authenticated and CORS is configured
            const isAuthenticated = window.firebaseAuthenticated === true;
            const isCorsConfigured = window.firebaseCorsConfigured === true;
            if (isAuthenticated && isCorsConfigured && photoUrl !== null) {
                try {
                    // Generate a unique filename to prevent overwriting
                    const timestamp = new Date().getTime();
                    const uniqueFilename = `${timestamp}_${photo.name}`;

                    // Use modular Firebase Storage SDK
                    const storageRef = window.firebaseStorageRef(storage, `images/${uniqueFilename}`);

                    // Set a timeout for the upload operation
                    const uploadPromise = window.firebaseUploadBytes(storageRef, photo);
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Upload timed out after 5 seconds')), 5000)
                    );

                    // Race the upload against the timeout
                    console.log('Uploading photo to Firebase Storage...');
                    await Promise.race([uploadPromise, timeoutPromise]);

                    // If we get here, the upload succeeded, so get the download URL
                    console.log('Photo uploaded successfully, getting download URL...');
                    const urlPromise = window.firebaseGetDownloadURL(storageRef);
                    const urlTimeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Getting URL timed out after 5 seconds')), 5000)
                    );

                    // Race the URL retrieval against the timeout
                    const firebaseUrl = await Promise.race([urlPromise, urlTimeoutPromise]);
                    console.log('Firebase URL obtained:', firebaseUrl);

                    // Use the Firebase URL instead of the data URL
                    photoUrl = firebaseUrl;
                } catch (error) {
                    console.error('Error with Firebase Storage:', error);
                    console.log('Using data URL as fallback');
                    // Keep using the data URL (already set above)
                }
            } else if ((!isAuthenticated || !isCorsConfigured) && photoUrl !== null) {
                if (!isAuthenticated) {
                    console.warn('Not authenticated for Storage operations, using data URL');
                }
                if (!isCorsConfigured) {
                    console.warn('CORS not configured for Firebase Storage, using data URL');
                }
                // Keep using the data URL (already set above)
            }
        }

        // Update the nanny in Firestore
        console.log('Updating nanny in Firestore...');
        const nanniesCollection = window.firebaseCollection(db, 'nannies');
        const nannyDocRef = window.firebaseDoc(nanniesCollection, nannyId);

        // Create update object
        const updateData = {
            name: name,
            experience: experience,
            availability: availability,
            languages: languages,
            bio: bio,
            updatedAt: window.firebaseServerTimestamp()
        };

        // Only update photo if we have a new one
        if (photoUrl !== null) {
            updateData.photo = photoUrl;
        }

        await window.firebaseUpdateDoc(nannyDocRef, updateData);

        alert('Nanny updated successfully!');
        clearForm();
        fetchNannies();
    } catch (error) {
        console.error('Error in editNanny:', error);

        // Try to update the nanny without the image
        try {
            console.log('Attempting to update nanny without changing image...');
            const nanniesCollection = window.firebaseCollection(db, 'nannies');
            const nannyDocRef = window.firebaseDoc(nanniesCollection, nannyId);
            await window.firebaseUpdateDoc(nannyDocRef, {
                name: name,
                experience: experience,
                availability: availability,
                languages: languages,
                bio: bio,
                updatedAt: window.firebaseServerTimestamp()
            });

            alert('Nanny updated successfully (without changing image)!');
            clearForm();
            fetchNannies();
        } catch (innerError) {
            console.error('Error updating nanny without image:', innerError);
            alert('Error updating nanny: ' + innerError.message + '\n\nSwitching to offline mode.');
            enableOfflineMode();
            editNanny(nannyId); // Try again in offline mode
        }
    }
}

// Function to handle deleting a nanny
async function deleteNanny(nannyId) {
    // Check if in offline mode
    if (isOfflineMode) {
        // Find and remove the mock nanny
        const mockIndex = mockNannies.findIndex(nanny => nanny.id === nannyId);
        if (mockIndex !== -1) {
            mockNannies.splice(mockIndex, 1);
            alert('Nanny deleted successfully in offline mode!');
            displayNannies(mockNannies);
        } else {
            alert('Error: Could not find nanny with ID ' + nannyId + ' in offline mode.');
        }
        return;
    }

    // If online, proceed with Firebase using the modular SDK
    try {
        // First, get the nanny to check if it has an image to delete
        const nanniesCollection = window.firebaseCollection(db, 'nannies');
        const nannyDocRef = window.firebaseDoc(nanniesCollection, nannyId);

        try {
            // Get the nanny document
            const nannyDoc = await window.firebaseGetDoc(nannyDocRef);

            if (nannyDoc.exists()) {
                const nannyData = nannyDoc.data();

                // Check if the nanny has a Firebase Storage image URL
                if (nannyData.photo && nannyData.photo.includes('firebasestorage.googleapis.com')) {
                    try {
                        // Extract the path from the URL
                        const url = new URL(nannyData.photo);
                        const path = decodeURIComponent(url.pathname.split('/o/')[1]);

                        if (path) {
                            // Delete the image from Firebase Storage
                            console.log('Attempting to delete image from Firebase Storage:', path);
                            const imageRef = window.firebaseStorageRef(storage, path);
                            // Note: We're not awaiting this operation to avoid blocking if it fails
                            // The image deletion is not critical for the nanny deletion
                            window.firebaseDeleteObject(imageRef).catch(err => {
                                console.warn('Could not delete image from storage:', err);
                            });
                        }
                    } catch (imageError) {
                        console.warn('Error parsing image URL, skipping image deletion:', imageError);
                    }
                }
            }
        } catch (docError) {
            console.warn('Could not fetch nanny document before deletion:', docError);
            // Continue with deletion even if we couldn't get the document
        }

        // Delete the nanny from Firestore
        console.log('Deleting nanny from Firestore...');
        await window.firebaseDeleteDoc(nannyDocRef);

        alert('Nanny deleted successfully!');
        // Refresh the nanny list
        fetchNannies();
    } catch (error) {
        console.error('Error deleting nanny:', error);
        alert('Error deleting nanny: ' + error.message + '\n\nSwitching to offline mode.');
        enableOfflineMode();
        deleteNanny(nannyId); // Try again in offline mode
    }
}

// Function to check network status and Firebase availability
async function checkNetworkAndFirebase() {
    // Check if online
    if (!navigator.onLine) {
        console.warn('Browser is offline. Firebase operations may fail.');
        alert('You are currently offline. Some features may not work properly.');
        return false;
    }

    try {
        // Try a simple Firebase operation to check if the service is accessible
        if (window.firebaseApp) {
            console.log('Firebase is accessible');
            return true;
        } else {
            throw new Error('Firebase app is not initialized');
        }
    } catch (error) {
        console.error('Firebase is not accessible:', error);
        alert('Cannot access Firebase services. Please check your internet connection and try again later.');
        return false;
    }
}

// Initialize Firebase and set up the admin credentials
initFirebase();

// Add event listeners for online/offline status
window.addEventListener('online', () => {
    console.log('Browser is now online');
    // Try to reconnect to Firebase
    if (!isOfflineMode) {
        // Refresh data if admin is logged in
        if (adminContent.style.display !== 'none') {
            fetchNannies();
        }
    } else {
        // Try to reinitialize Firebase
        initFirebase();
    }
});

window.addEventListener('offline', () => {
    console.log('Browser is now offline');
    alert('You are offline. The application will work in offline mode with limited functionality.');
    enableOfflineMode();
});
