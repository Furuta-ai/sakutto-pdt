class TimeConverter {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.dateInput = document.getElementById('dateInput');
        this.convertBtn = document.getElementById('convertBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.resultBox = document.getElementById('resultBox');
        this.jstTime = document.getElementById('jstTime');
        this.pdtLabel = document.getElementById('pdtLabel');
        this.pdtTime = document.getElementById('pdtTime');
        this.timeDiff = document.getElementById('timeDiff');
        this.pstTime = document.getElementById('pstTime');
        this.dstWarning = document.getElementById('dstWarning');
    }

    bindEvents() {
        this.convertBtn.addEventListener('click', () => this.convert());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.dateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.convert();
            }
        });
    }

    isDST(date) {
        const year = date.getFullYear();
        
        const march2ndSunday = this.getNthSundayOfMonth(year, 2, 2);
        const november1stSunday = this.getNthSundayOfMonth(year, 10, 1);
        
        const dateTime = date.getTime();
        const dstStart = new Date(year, 2, march2ndSunday, 2, 0, 0).getTime();
        const dstEnd = new Date(year, 10, november1stSunday, 2, 0, 0).getTime();
        
        return dateTime >= dstStart && dateTime < dstEnd;
    }

    getNthSundayOfMonth(year, month, n) {
        const firstDay = new Date(year, month, 1);
        const firstSunday = 1 + (7 - firstDay.getDay()) % 7;
        return firstSunday + (n - 1) * 7;
    }

    isDSTTransitionDay(date) {
        const year = date.getFullYear();
        const march2ndSunday = this.getNthSundayOfMonth(year, 2, 2);
        const november1stSunday = this.getNthSundayOfMonth(year, 10, 1);
        
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const marchTransition = `${year}-03-${String(march2ndSunday).padStart(2, '0')}`;
        const novemberTransition = `${year}-11-${String(november1stSunday).padStart(2, '0')}`;
        
        return dateStr === marchTransition || dateStr === novemberTransition;
    }

    normalizeInput(input) {
        return input.replace(/[\u3000\s]+/g, ' ')
                   .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
                   .replace(/[：]/g, ':')
                   .replace(/[／]/g, '/')
                   .replace(/[－]/g, '-')
                   .trim();
    }

    parseDateTime(input) {
        const normalized = this.normalizeInput(input);
        
        if (normalized.toLowerCase().includes('jst')) {
            const cleaned = normalized.replace(/\s*jst\s*/i, '').trim();
            return this.parseDateTime(cleaned);
        }
        
        if (normalized.match(/\s+(pst|pdt|utc|gmt|est|edt|cst|cdt|mst|mdt)/i)) {
            throw new Error('このツールはJST入力専用です。TZを付ける場合は「JST」と明記してください。');
        }

        if (/^\d+$/.test(normalized)) {
            return this.parseNumericInput(normalized);
        }

        const formats = [
            /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
            /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
            /^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{2})(?::(\d{2}))?$/
        ];

        for (const format of formats) {
            const match = normalized.match(format);
            if (match) {
                const [, year, month, day, hour, minute, second = '0'] = match;
                const date = new Date(
                    parseInt(year),
                    parseInt(month) - 1,
                    parseInt(day),
                    parseInt(hour),
                    parseInt(minute),
                    parseInt(second)
                );

                if (isNaN(date.getTime()) || 
                    date.getFullYear() !== parseInt(year) ||
                    date.getMonth() !== parseInt(month) - 1 ||
                    date.getDate() !== parseInt(day) ||
                    date.getHours() !== parseInt(hour) ||
                    date.getMinutes() !== parseInt(minute) ||
                    date.getSeconds() !== parseInt(second)) {
                    throw new Error('無効な日時です。');
                }

                return date;
            }
        }

        throw new Error('日時の形式を確認してください（例：20250811、202508111400、2025-08-11 14:00）');
    }

    parseNumericInput(input) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();

        if (input.length === 8) {
            const year = parseInt(input.substring(0, 4));
            const month = parseInt(input.substring(4, 6));
            const day = parseInt(input.substring(6, 8));
            
            if (year < 1900 || year > 3000 || month < 1 || month > 12 || day < 1 || day > 31) {
                throw new Error('無効な日付です（YYYYMMDD形式）');
            }
            
            return new Date(year, month - 1, day, 9, 0, 0);
        }
        
        if (input.length === 12) {
            const year = parseInt(input.substring(0, 4));
            const month = parseInt(input.substring(4, 6));
            const day = parseInt(input.substring(6, 8));
            const hour = parseInt(input.substring(8, 10));
            const minute = parseInt(input.substring(10, 12));
            
            if (year < 1900 || year > 3000 || month < 1 || month > 12 || 
                day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                throw new Error('無効な日時です（YYYYMMDDHHMM形式）');
            }
            
            return new Date(year, month - 1, day, hour, minute, 0);
        }
        
        if (input.length === 4) {
            const month = parseInt(input.substring(0, 2));
            const day = parseInt(input.substring(2, 4));
            
            if (month < 1 || month > 12 || day < 1 || day > 31) {
                throw new Error('無効な日付です（MMDD形式）');
            }
            
            return new Date(currentYear, month - 1, day, 9, 0, 0);
        }
        
        if (input.length === 8 && input.includes('.')) {
            throw new Error('数字のみで入力してください');
        }
        
        if (input.length === 6) {
            const month = parseInt(input.substring(0, 2));
            const day = parseInt(input.substring(2, 4));
            const hour = parseInt(input.substring(4, 6));
            
            if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23) {
                throw new Error('無効な日時です（MMDDHH形式）');
            }
            
            return new Date(currentYear, month - 1, day, hour, 0, 0);
        }
        
        if (input.length === 8) {
            const month = parseInt(input.substring(0, 2));
            const day = parseInt(input.substring(2, 4));
            const hour = parseInt(input.substring(4, 6));
            const minute = parseInt(input.substring(6, 8));
            
            if (month < 1 || month > 12 || day < 1 || day > 31 || 
                hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                throw new Error('無効な日時です（MMDDHHMM形式）');
            }
            
            return new Date(currentYear, month - 1, day, hour, minute, 0);
        }

        throw new Error('対応していない数字形式です（4桁:MMDD、6桁:MMDDHH、8桁:YYYYMMDD/MMDDHHMM、12桁:YYYYMMDDHHMM）');
    }

    formatDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hour}:${minute}`;
    }

    convert() {
        this.clearError();
        
        const input = this.dateInput.value.trim();
        if (!input) {
            this.showError('日時を入力してください');
            return;
        }

        try {
            const jstDate = this.parseDateTime(input);
            
            const isDST = this.isDST(jstDate);
            const isDSTTransition = this.isDSTTransitionDay(jstDate);
            
            const utcTime = new Date(jstDate.getTime() - 9 * 60 * 60 * 1000);
            const pacificOffset = isDST ? -7 : -8;
            const pacificTime = new Date(utcTime.getTime() + pacificOffset * 60 * 60 * 1000);
            
            this.displayResult(jstDate, pacificTime, utcTime, isDST, isDSTTransition);
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    displayResult(jstDate, pacificTime, utcTime, isDST, isDSTTransition) {
        this.jstTime.textContent = this.formatDateTime(jstDate);
        
        const tzLabel = isDST ? 'PDT:' : 'PST:';
        const timeDiff = isDST ? 'JST-16h' : 'JST-17h';
        const tzInfo = isDST ? '夏時間 / UTC-7' : '冬時間 / UTC-8';
        
        this.pdtLabel.textContent = tzLabel;
        this.pdtTime.textContent = this.formatDateTime(pacificTime);
        this.timeDiff.textContent = `（${tzInfo}, ${timeDiff}）`;
        
        // PST時間を常に表示（JST - 17時間）
        const pstTime = new Date(utcTime.getTime() - 8 * 60 * 60 * 1000);
        this.pstTime.textContent = this.formatDateTime(pstTime);
        
        
        if (isDSTTransition) {
            this.dstWarning.classList.remove('hidden');
        } else {
            this.dstWarning.classList.add('hidden');
        }
        
        this.showResult();
    }

    showResult() {
        this.resultBox.classList.remove('hidden');
        setTimeout(() => {
            this.resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 200);
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.dateInput.classList.add('error');
        this.hideResult();
    }

    clearError() {
        this.errorMessage.textContent = '';
        this.dateInput.classList.remove('error');
    }

    hideResult() {
        this.resultBox.classList.add('hidden');
    }

    reset() {
        this.dateInput.value = '';
        this.clearError();
        this.hideResult();
        this.dateInput.focus();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TimeConverter();
});