document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('settingsForm');
    const domainInput = document.getElementById('domain');
    const numPostsInput = document.getElementById('numPosts');

    // Load saved settings
    loadSettings();

    // Handle form submission. TODO: This handles both buttons, I don't know if we want to save settings if we're just refreshing authorization
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        saveSettings();
    });

    document.getElementById('connectMastodon').addEventListener('click', function() {
        const domain = domainInput.value;
		console.log(domain);

        if (!domain) {
            alert('Mastodon server domain is required!');
            return;
        }

        // Send a message to background.js to handle OAuth process
        browser.runtime.sendMessage({
            action: 'authorize',
            domain: domain
        }).then(response => {
            if (response.success) {
                alert('Connected to Mastodon successfully!');
            } else {
                alert('Failed to connect to Mastodon: ' + response.error);
            }
        }).catch(error => {
            console.error('Error during OAuth process:', error);
            alert('Failed to connect to Mastodon. Please try again.');
        });
    });

    function saveSettings() {
        const domain = domainInput.value;
        const numPosts = numPostsInput.value;

        browser.storage.local.set({
            domain: domain,
            numPosts: numPosts
        }).then(() => {
            alert('Settings saved successfully!');
        }).catch(error => {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings.');
        });
    }

    function loadSettings() {
        browser.storage.local.get(['domain', 'numPosts'])
            .then(({ domain, numPosts = 5 }) => {
                if (domain) domainInput.value = domain;
                if (numPosts) numPostsInput.value = numPosts;
            })
            .catch(error => {
                console.error('Failed to load settings:', error);
            });
    }
});
