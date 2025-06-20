class OrderExtensionApp {
  constructor() {
    this.selectedDuration = null;
    this.apiUrl = 'https://api.clickandshare.io/extend-order-tw';
    this.orderId = this.getOrderIdFromUrl();
    this.init();
  }

  getOrderIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  init() {
    this.bindEvents();
    
    // Show error if no order ID
    if (!this.orderId) {
      console.warn('No order ID found in URL parameters');
    }
  }

  bindEvents() {
    // Option button clicks
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.selectDuration(e));
    });

    // Confirm button click
    document.getElementById('confirmBtn').addEventListener('click', () => {
      this.confirmExtension();
    });
  }

  selectDuration(event) {
    const button = event.currentTarget;
    const duration = button.dataset.duration;
    const durationText = button.querySelector('.duration').textContent;

    // Remove previous selection
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.classList.remove('selected');
    });

    // Add selection to clicked button
    button.classList.add('selected');

    // Store selected duration
    this.selectedDuration = {
      value: parseInt(duration), // Convert to number
      text: durationText
    };

    // Show confirmation section
    this.showConfirmation(durationText);
  }

  showConfirmation(durationText) {
    const confirmationSection = document.getElementById('confirmationSection');
    const selectedDurationEl = document.getElementById('selectedDuration');
    
    selectedDurationEl.textContent = `Ausgewählte Dauer: ${durationText}`;
    confirmationSection.style.display = 'block';
  }

  async confirmExtension() {
    if (!this.selectedDuration) {
      alert('Bitte wählen Sie eine Dauer aus.');
      return;
    }

    if (!this.orderId) {
      alert('Fehler: Keine Bestell-ID gefunden. Bitte überprüfen Sie die URL.');
      return;
    }

    // Show loading state
    this.showLoading();

    try {
      // Build URL with query parameters
      const apiUrl = new URL(this.apiUrl);
      apiUrl.searchParams.append('OrderId', this.orderId);
      apiUrl.searchParams.append('Stunden', this.selectedDuration.value);

      console.log('Calling API:', apiUrl.toString());

      // Call REST API with GET request
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get response text first for debugging
      const responseText = await response.text();
      console.log('Raw API response:', responseText);

      // Check if response is empty
      if (!responseText || responseText.trim().length === 0) {
        console.log('Empty response received');
        this.hideLoading();
        alert('Fehler: Leere Antwort vom Server erhalten.');
        return;
      }

      let redirectUrl = null;

      // Try to parse as JSON first
      try {
        const data = JSON.parse(responseText.trim());
        console.log('Parsed API response:', data);
        
        // Look for URL in various possible fields
        if (data.url) {
          redirectUrl = data.url;
        } else if (data.paymentLink) {
          redirectUrl = data.paymentLink;
        } else if (data.redirectUrl) {
          redirectUrl = data.redirectUrl;
        } else if (data.link) {
          redirectUrl = data.link;
        }
      } catch (e) {
        console.log('Response is not JSON, treating as plain text URL');
        // If it's not JSON, treat the response as a plain URL
        const trimmedResponse = responseText.trim();
        if (trimmedResponse.startsWith('http')) {
          redirectUrl = trimmedResponse;
        }
      }

      // Try to extract URL using regex if still not found
      if (!redirectUrl) {
        const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
        const urls = responseText.match(urlRegex);
        
        if (urls && urls.length > 0) {
          redirectUrl = urls[0];
          console.log('Found URL using regex:', redirectUrl);
        }
      }
      
      if (redirectUrl) {
        console.log('Redirecting to:', redirectUrl);
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      } else {
        console.error('No URL found in API response');
        console.log('Full response:', responseText);
        this.hideLoading();
        alert('Fehler: Keine Weiterleitungs-URL in der API-Antwort gefunden.');
      }

    } catch (error) {
      console.error('Error calling API:', error);
      this.hideLoading();
      alert('Fehler beim Bearbeiten der Anfrage. Bitte versuchen Sie es erneut.');
    }
  }

  showLoading() {
    document.getElementById('confirmationSection').style.display = 'none';
    document.getElementById('loading').style.display = 'block';
    
    // Disable all buttons
    document.querySelectorAll('.option-btn, .confirm-btn').forEach(btn => {
      btn.disabled = true;
    });
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('confirmationSection').style.display = 'block';
    
    // Re-enable buttons
    document.querySelectorAll('.option-btn, .confirm-btn').forEach(btn => {
      btn.disabled = false;
    });
  }

  resetApp() {
    // Reset selection
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Hide confirmation and loading
    document.getElementById('confirmationSection').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    
    // Clear selected duration
    this.selectedDuration = null;
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OrderExtensionApp();
});