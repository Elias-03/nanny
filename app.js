// EmailJS configuration
const emailjsConfig = {
    publicKey: 'je55Q8tk2Zal6cXyn',
    templateId: 'template_cdvh9v2',
    serviceId: 'clems_nanny'
};

// Firebase is now initialized in each HTML file using ES modules
// This allows us to use the modular Firebase SDK
let db;

// Check if Firebase is initialized by the page
function checkFirebaseInitialization() {
    if (window.firebaseDb) {
        // Firebase is already initialized in the HTML file
        console.log('Firebase already initialized in the HTML file');
        db = window.firebaseDb;
        return true;
    }
    return false;
}

// DOM Elements
const requestForm = document.getElementById('nanny-request-form');
const modal = document.getElementById('request-form');
const closeBtn = document.querySelector('.close');
const nannyCardsContainer = document.getElementById('nanny-cards');

// Load nannies from Firestore
async function loadNannies() {
    try {
        // Check if Firebase is initialized
        if (!checkFirebaseInitialization()) {
            console.warn('Firebase not initialized, using mock data');
            if (window.mockNannies) {
                window.mockNannies.forEach(nanny => {
                    createNannyCard(nanny, nanny.id);
                });
            } else {
                console.error('Mock nannies data not available');
            }
            return;
        }

        // Use the modular Firebase SDK
        const nanniesCollection = window.firebaseCollection(db, 'nannies');
        const snapshot = await window.firebaseGetDocs(nanniesCollection);

        if (snapshot.empty) {
            console.log('No nannies found in Firestore');
            return;
        }

        snapshot.forEach(doc => {
            createNannyCard(doc.data(), doc.id);
        });
    } catch (error) {
        console.error('Error loading nannies:', error);

        // Fallback to mock data
        if (window.mockNannies) {
            window.mockNannies.forEach(nanny => {
                createNannyCard(nanny, nanny.id);
            });
        }
    }
}

// Create a nanny card
function createNannyCard(nanny, id) {
    // Check if the container exists
    if (!nannyCardsContainer) {
        console.error('Nanny cards container not found');
        return;
    }

    // Check if nanny data is valid
    if (!nanny || !id) {
        console.error('Invalid nanny data:', nanny);
        return;
    }

    const card = document.createElement('div');
    card.className = 'nanny-card';

    // Handle potential undefined values
    const photo = nanny.photo || '../images/default-nanny.jpg';
    const name = nanny.name || 'Unknown Nanny';
    const experience = nanny.experience || 'N/A';
    const availability = nanny.availability || 'Not specified';
    const bio = nanny.bio || 'No biography available';

    // Handle languages array safely
    let languagesHtml = '';
    if (nanny.languages) {
        if (Array.isArray(nanny.languages)) {
            languagesHtml = `<p><strong>Languages:</strong> ${nanny.languages.join(', ')}</p>`;
        } else if (typeof nanny.languages === 'string') {
            languagesHtml = `<p><strong>Languages:</strong> ${nanny.languages}</p>`;
        }
    }

    card.innerHTML = `
        <img src="${photo}" alt="${name}" onerror="this.src='../images/default-nanny.jpg'">
        <h3>${name}</h3>
        <p><strong>Experience:</strong> ${experience} ${experience !== 'N/A' ? 'years' : ''}</p>
        <p><strong>Availability:</strong> ${availability}</p>
        ${languagesHtml}
        <p>${bio}</p>
        <button onclick="openRequestForm('${id}', '${name}')">Request this Nanny</button>
    `;

    nannyCardsContainer.appendChild(card);
}

// Open request form
function openRequestForm(nannyId, nannyName) {
    document.getElementById('selected-nanny').value = nannyId;
    document.querySelector('.modal-content h2').textContent = `Request ${nannyName}`;
    modal.style.display = 'block';
}

// Close request form
function closeRequestForm() {
    modal.style.display = 'none';
}

closeBtn.onclick = closeRequestForm;

// Handle form submission
requestForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        phone: document.getElementById('user-phone').value,
        nannyId: document.getElementById('selected-nanny').value
    };

    try {
        // Send email using EmailJS
        await emailjs.send(
            emailjsConfig.serviceId,
            emailjsConfig.templateId,
            {
                to_email: 'kiraflix.uk@gmail.com',
                from_name: formData.name,
                from_email: formData.email,
                phone: formData.phone,
                nanny_id: formData.nannyId
            },
            emailjsConfig.publicKey
        );

        // Clear form and close modal
        requestForm.reset();
        closeRequestForm();
        alert('Request sent successfully! We will contact you soon.');
    } catch (error) {
        console.error('Error sending email:', error);
        alert('There was an error sending your request. Please try again.');
    }
});

// Initialize when page loads
window.onload = function () {
    // Check if we're on the nannies page
    if (nannyCardsContainer) {
        console.log('Nannies page detected, loading nannies');
        loadNannies();
    } else {
        console.log('Not on nannies page, skipping nanny loading');
    }

    // Set up modal event listeners if modal exists
    if (modal) {
        // Close modal when clicking outside
        window.onclick = function (event) {
            if (event.target == modal) {
                closeRequestForm();
            }
        };
    }

    // Initialize EmailJS if it exists
    if (typeof emailjs !== 'undefined') {
        emailjs.init(emailjsConfig.publicKey);
    }

    console.log('App initialization complete');
};
