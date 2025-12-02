import { injectable } from "inversify";

@injectable()
export class ValidationService {
    validateId(id: string): boolean {
        return typeof id === 'string' && id.length > 0;
    }

    validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof email === 'string' && emailRegex.test(email);
    }

    validateRequired(value: unknown): boolean {
        return value !== undefined && value !== null && value !== '';
    }
}