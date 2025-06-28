const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SystemDiagnostics {
    constructor() {
        this.results = [];
        this.errors = [];
        this.baseURL = 'http://localhost:3001';
        this.externalURL = 'http://34.68.67.41:3001';
        this.frontendLocal = 'http://localhost:3000';
        this.frontendExternal = 'http://34.68.67.41:3000';
    }

    log(message, isError = false) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        
        if (isError) {
            this.errors.push(logMessage);
        } else {
            this.results.push(logMessage);
        }
    }

    async testNetworkConnectivity() {
        this.log('=== TESTING NETWORK CONNECTIVITY ===');
        
        const tests = [
            { name: 'Backend Local Health', url: `${this.baseURL}/health` },
            { name: 'Backend External Health', url: `${this.externalURL}/health` },
            { name: 'Frontend Local', url: this.frontendLocal },
            { name: 'Frontend External', url: this.frontendExternal }
        ];

        for (const test of tests) {
            try {
                const response = await axios.get(test.url, { timeout: 5000 });
                this.log(`✅ ${test.name}: STATUS ${response.status}`);
                if (response.data) {
                    this.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
                }
            } catch (error) {
                this.log(`❌ ${test.name}: ${error.message}`, true);
                if (error.response) {
                    this.log(`   Status: ${error.response.status}`, true);
                }
            }
        }
    }

    async testAPIEndpoints() {
        this.log('=== TESTING API ENDPOINTS ===');
        
        const endpoints = [
            '/health',
            '/api/categories',
            '/api/announcements', 
            '/api/rules',
            '/auth/status'
        ];

        for (const endpoint of endpoints) {
            for (const baseUrl of [this.baseURL, this.externalURL]) {
                try {
                    const response = await axios.get(`${baseUrl}${endpoint}`, { 
                        timeout: 5000,
                        headers: {
                            'Origin': 'http://34.68.67.41:3000'
                        }
                    });
                    this.log(`✅ ${baseUrl}${endpoint}: STATUS ${response.status}`);
                } catch (error) {
                    this.log(`❌ ${baseUrl}${endpoint}: ${error.message}`, true);
                    if (error.response) {
                        this.log(`   Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`, true);
                    }
                }
            }
        }
    }

    async testCORSConfiguration() {
        this.log('=== TESTING CORS CONFIGURATION ===');
        
        const origins = [
            'http://localhost:3000',
            'http://34.68.67.41:3000',
            'http://127.0.0.1:3000'
        ];

        for (const origin of origins) {
            try {
                const response = await axios.options(`${this.externalURL}/api/categories`, {
                    headers: {
                        'Origin': origin,
                        'Access-Control-Request-Method': 'GET',
                        'Access-Control-Request-Headers': 'Content-Type'
                    },
                    timeout: 5000
                });
                this.log(`✅ CORS for ${origin}: STATUS ${response.status}`);
                this.log(`   Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin'] || 'NOT SET'}`);
            } catch (error) {
                this.log(`❌ CORS for ${origin}: ${error.message}`, true);
            }
        }
    }

    async testEnvironmentConfig() {
        this.log('=== TESTING ENVIRONMENT CONFIGURATION ===');
        
        const envVars = [
            'NODE_ENV',
            'LOCAL_DEV', 
            'SERVER_IP',
            'DISCORD_CLIENT_ID',
            'DISCORD_CLIENT_SECRET',
            'DISCORD_BOT_TOKEN',
            'DISCORD_GUILD_ID'
        ];

        for (const envVar of envVars) {
            const value = process.env[envVar];
            if (value) {
                // Mask sensitive data
                const maskedValue = envVar.includes('SECRET') || envVar.includes('TOKEN') 
                    ? value.substring(0, 8) + '...'
                    : value;
                this.log(`✅ ${envVar}: ${maskedValue}`);
            } else {
                this.log(`❌ ${envVar}: NOT SET`, true);
            }
        }
    }

    async testProcesses() {
        this.log('=== TESTING RUNNING PROCESSES ===');
        
        const { exec } = require('child_process');
        
        return new Promise((resolve) => {
            exec('ps aux | grep node | grep -v grep', (error, stdout) => {
                if (error) {
                    this.log(`❌ Process check failed: ${error.message}`, true);
                } else {
                    const processes = stdout.trim().split('\n').filter(line => line.trim());
                    this.log(`✅ Found ${processes.length} Node.js processes:`);
                    processes.forEach(proc => {
                        this.log(`   ${proc}`);
                    });
                }
                resolve();
            });
        });
    }

    async testPortsListening() {
        this.log('=== TESTING PORT BINDING ===');
        
        const { exec } = require('child_process');
        
        return new Promise((resolve) => {
            exec('netstat -tlnp | grep ":300"', (error, stdout) => {
                if (error) {
                    this.log(`❌ Port check failed: ${error.message}`, true);
                } else {
                    const ports = stdout.trim().split('\n').filter(line => line.trim());
                    this.log(`✅ Found ${ports.length} services on ports 300x:`);
                    ports.forEach(port => {
                        this.log(`   ${port}`);
                    });
                }
                resolve();
            });
        });
    }

    async testFileSystem() {
        this.log('=== TESTING FILE SYSTEM ===');
        
        const files = [
            '../backend/.env',
            '../backend/server.js',
            '../backend/package.json',
            '../frontend/package.json',
            '../backend/database/ddg_prisonrp.db'
        ];

        for (const file of files) {
            try {
                const fullPath = path.resolve(__dirname, file);
                const stats = fs.statSync(fullPath);
                this.log(`✅ ${file}: EXISTS (${stats.size} bytes)`);
            } catch (error) {
                this.log(`❌ ${file}: ${error.message}`, true);
            }
        }
    }

    async runAllTests() {
        this.log('🚀 STARTING COMPREHENSIVE SYSTEM DIAGNOSTICS');
        this.log(`Timestamp: ${new Date().toISOString()}`);
        this.log('='.repeat(60));

        await this.testEnvironmentConfig();
        await this.testFileSystem();
        await this.testProcesses();
        await this.testPortsListening();
        await this.testNetworkConnectivity();
        await this.testAPIEndpoints();
        await this.testCORSConfiguration();

        this.log('='.repeat(60));
        this.log(`✅ TESTS COMPLETED: ${this.results.length} results`);
        this.log(`❌ ERRORS FOUND: ${this.errors.length} errors`);
        
        if (this.errors.length > 0) {
            this.log('\n🔴 ERROR SUMMARY:');
            this.errors.forEach(error => this.log(error));
        }

        // Save results to file
        const reportPath = path.join(__dirname, 'diagnostic-report.txt');
        const fullReport = [...this.results, ...this.errors].join('\n');
        fs.writeFileSync(reportPath, fullReport);
        this.log(`📄 Full report saved to: ${reportPath}`);
    }
}

if (require.main === module) {
    const diagnostics = new SystemDiagnostics();
    diagnostics.runAllTests().catch(console.error);
}

module.exports = SystemDiagnostics; 