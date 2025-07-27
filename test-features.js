// Test script to verify features are working
console.log('🧪 Testing Beesoft features...');

// Test 1: Check if total messages counter functions exist
setTimeout(() => {
  console.log('📊 Testing Total Messages Counter...');
  
  if (typeof initializeTotalMessagesCounter === 'function') {
    console.log('✅ initializeTotalMessagesCounter function exists');
    
    // Test the counter
    if (typeof incrementTotalMessagesSent === 'function') {
      console.log('✅ incrementTotalMessagesSent function exists');
      
      // Add a test button to manually increment counter
      const testBtn = document.createElement('button');
      testBtn.innerHTML = '🧪 Test Counter (+1)';
      testBtn.style.cssText = `
        position: fixed;
        top: 60px;
        left: 15px;
        z-index: 999997;
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
      `;
      testBtn.addEventListener('click', () => {
        incrementTotalMessagesSent(1);
        console.log('📊 Counter incremented manually');
      });
      document.body.appendChild(testBtn);
      
    } else {
      console.error('❌ incrementTotalMessagesSent function not found');
    }
  } else {
    console.error('❌ initializeTotalMessagesCounter function not found');
  }
}, 1000);

// Test 2: Check developer authentication
setTimeout(() => {
  console.log('🔧 Testing Developer Authentication...');
  
  if (typeof checkDeveloperAuth === 'function') {
    console.log('✅ checkDeveloperAuth function exists');
  } else {
    console.error('❌ checkDeveloperAuth function not found');
  }
  
  if (typeof showDeveloperLogin === 'function') {
    console.log('✅ showDeveloperLogin function exists');
    
    // Add a test button to manually open developer login
    const devTestBtn = document.createElement('button');
    devTestBtn.innerHTML = '🔧 Test Dev Login';
    devTestBtn.style.cssText = `
      position: fixed;
      top: 100px;
      left: 15px;
      z-index: 999997;
      background: #4f46e5;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    `;
    devTestBtn.addEventListener('click', () => {
      showDeveloperLogin();
      console.log('🔧 Developer login opened manually');
    });
    document.body.appendChild(devTestBtn);
    
  } else {
    console.error('❌ showDeveloperLogin function not found');
  }
}, 1500);

// Test 3: Check keyboard shortcut
setTimeout(() => {
  console.log('⌨️ Testing Keyboard Shortcut...');
  console.log('💡 Press Ctrl+Shift+E to test developer login');
}, 2000);

console.log('🎯 Test setup complete! Check the console and look for test buttons.');