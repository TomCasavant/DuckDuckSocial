document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('settingsForm');
    const domainInput = document.getElementById('domain');
    const apiKeyInput = document.getElementById('apiKey');
    const numPostsInput = document.getElementById('numPosts');

    // Load saved settings
    loadSettings();

    // Handle form submission
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        saveSettings();
    });

    function saveSettings() {
        const domain = domainInput.value;
        const apiKey = apiKeyInput.value;
        const numPosts = numPostsInput.value;

        localStorage.setItem('domain', domain);
        localStorage.setItem('apiKey', apiKey);
        localStorage.setItem('numPosts', numPosts);

        alert('Settings saved successfully!');
    }

    function loadSettings() {
        const savedDomain = localStorage.getItem('domain');
        const savedApiKey = localStorage.getItem('apiKey');
        const savedNumPosts = localStorage.getItem('numPosts');

        if (savedDomain) domainInput.value = savedDomain;
        if (savedApiKey) apiKeyInput.value = savedApiKey;
        if (savedNumPosts) numPostsInput.value = savedNumPosts;
    }
});
