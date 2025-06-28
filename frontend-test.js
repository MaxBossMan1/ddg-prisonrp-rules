#!/usr/bin/env node

const { spawn } = require('child_process');
const axios = require('axios');

class FrontendTest {
    constructor() {
        this.externalIP = '34.68.67.41';
        this.frontendPort = 3000;
        this.backendPort = 3001;
    }

    log(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    async testBrowserAccess() {
        this.log('=== TESTING BROWSER ACCESS ===');
        
        try {
            // Test if frontend serves the main page
            const response = await axios.get(`http://${this.externalIP}:${this.frontendPort}`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            this.log(`✅ Frontend accessible: Status ${response.status}`);
            
            if (response.data.includes('DDG Prison RP Rules') || response.data.includes('react')) {
                this.log('✅ Frontend content looks correct');
            } else {
                this.log('⚠️  Frontend content may be incorrect');
                this.log(`   First 200 chars: ${response.data.substring(0, 200)}`);
            }
            
        } catch (error) {
            this.log(`❌ Frontend access failed: ${error.message}`);
            if (error.response) {
                this.log(`   Status: ${error.response.status}`);
            }
        }
    }

    async testAPIFromExternal() {
        this.log('=== TESTING API FROM EXTERNAL ===');
        
        const apiTests = [
            { name: 'Health Check', endpoint: '/health' },
            { name: 'Categories API', endpoint: '/api/categories' },
            { name: 'Auth Status', endpoint: '/auth/status' }
        ];

        for (const test of apiTests) {
            try {
                const response = await axios.get(`http://${this.externalIP}:${this.backendPort}${test.endpoint}`, {
                    timeout: 5000,
                    headers: {
                        'Origin': `http://${this.externalIP}:${this.frontendPort}`,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                this.log(`✅ ${test.name}: Status ${response.status}`);
                
                // Check CORS headers
                const corsHeader = response.headers['access-control-allow-origin'];
                if (corsHeader) {
                    this.log(`   CORS: ${corsHeader}`);
                } else {
                    this.log(`   ⚠️  No CORS header found`);
                }
                
            } catch (error) {
                this.log(`❌ ${test.name}: ${error.message}`);
                if (error.response) {
                    this.log(`   Status: ${error.response.status}`);
                    this.log(`   Data: ${JSON.stringify(error.response.data)}`);
                }
            }
        }
    }

    async testCORSPreflight() {
        this.log('=== TESTING CORS PREFLIGHT ===');
        
        try {
            const response = await axios.options(`http://${this.externalIP}:${this.backendPort}/api/categories`, {
                headers: {
                    'Origin': `http://${this.externalIP}:${this.frontendPort}`,
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type'
                },
                timeout: 5000
            });
            
            this.log(`✅ CORS Preflight: Status ${response.status}`);
            this.log(`   Allow-Origin: ${response.headers['access-control-allow-origin'] || 'NOT SET'}`);
            this.log(`   Allow-Methods: ${response.headers['access-control-allow-methods'] || 'NOT SET'}`);
            this.log(`   Allow-Headers: ${response.headers['access-control-allow-headers'] || 'NOT SET'}`);
            
        } catch (error) {
            this.log(`❌ CORS Preflight failed: ${error.message}`);
            if (error.response) {
                this.log(`   Status: ${error.response.status}`);
            }
        }
    }

    async simulateBrowserRequest() {
        this.log('=== SIMULATING BROWSER REQUEST ===');
        
        try {
            // First, get the frontend page
            const frontendResponse = await axios.get(`http://${this.externalIP}:${this.frontendPort}`, {
                timeout: 5000
            });
            this.log(`✅ Frontend page loaded: ${frontendResponse.status}`);
            
            // Then simulate an API request like a browser would make
            const apiResponse = await axios.get(`http://${this.externalIP}:${this.backendPort}/api/categories`, {
                headers: {
                    'Origin': `http://${this.externalIP}:${this.frontendPort}`,
                    'Referer': `http://${this.externalIP}:${this.frontendPort}/`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout: 5000
            });
            
            this.log(`✅ Browser-like API request: Status ${apiResponse.status}`);
            this.log(`   Response length: ${JSON.stringify(apiResponse.data).length} chars`);
            
        } catch (error) {
            this.log(`❌ Browser simulation failed: ${error.message}`);
            if (error.response) {
                this.log(`   Status: ${error.response.status}`);
                this.log(`   Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
            }
        }
    }

    async runTests() {
        this.log('🔍 STARTING FRONTEND CONNECTIVITY TESTS');
        this.log(`Testing Frontend: http://${this.externalIP}:${this.frontendPort}`);
        this.log(`Testing Backend: http://${this.externalIP}:${this.backendPort}`);
        this.log('='.repeat(50));
        
        await this.testBrowserAccess();
        await this.testAPIFromExternal();
        await this.testCORSPreflight();
        await this.simulateBrowserRequest();
        
        this.log('='.repeat(50));
        this.log('✅ Frontend connectivity tests completed');
    }
}

if (require.main === module) {
    const tester = new FrontendTest();
    tester.runTests().catch(console.error);
}

module.exports = FrontendTest; 