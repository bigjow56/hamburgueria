import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PhoneInputProps {
  value: string;
  onChange: (value: string, fullNumber: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  "data-testid"?: string;
}

const countries = [
  { code: "55", name: "Brasil", flag: "🇧🇷", format: "(##) #####-####" },
  { code: "1", name: "EUA", flag: "🇺🇸", format: "(###) ###-####" },
  { code: "54", name: "Argentina", flag: "🇦🇷", format: "(##) ####-####" },
  { code: "56", name: "Chile", flag: "🇨🇱", format: "(#) #### ####" },
];

export function PhoneInput({ 
  value, 
  onChange, 
  placeholder = "(11) 99999-9999", 
  required = false,
  id,
  "data-testid": dataTestId 
}: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState("55");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    // Initialize from prop value if provided
    if (value) {
      // Try to extract country code and number
      if (value.startsWith("55") && value.length >= 12) {
        setCountryCode("55");
        setPhoneNumber(value.substring(2));
      } else {
        setPhoneNumber(value);
      }
    }
  }, []);

  const formatBrazilianPhone = (input: string) => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, "");
    
    // Limit to 11 digits for Brazilian mobile
    const limited = digits.slice(0, 11);
    
    // Format based on length
    if (limited.length <= 2) {
      return `(${limited}`;
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
  };

  const formatPhoneByCountry = (input: string, country: string) => {
    switch (country) {
      case "55": // Brazil
        return formatBrazilianPhone(input);
      case "1": // USA
        const usDigits = input.replace(/\D/g, "").slice(0, 10);
        if (usDigits.length <= 3) return `(${usDigits}`;
        if (usDigits.length <= 6) return `(${usDigits.slice(0, 3)}) ${usDigits.slice(3)}`;
        return `(${usDigits.slice(0, 3)}) ${usDigits.slice(3, 6)}-${usDigits.slice(6)}`;
      default:
        return input.replace(/\D/g, "");
    }
  };

  const handlePhoneChange = (newPhone: string) => {
    const formatted = formatPhoneByCountry(newPhone, countryCode);
    setPhoneNumber(formatted);
    
    // Create full international number (only digits)
    const digitsOnly = formatted.replace(/\D/g, "");
    const fullNumber = countryCode + digitsOnly;
    
    // Call parent onChange with both formatted and full number
    onChange(formatted, fullNumber);
  };

  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    
    // Reformat existing number for new country
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    const reformatted = formatPhoneByCountry(digitsOnly, newCountryCode);
    setPhoneNumber(reformatted);
    
    const fullNumber = newCountryCode + digitsOnly;
    onChange(reformatted, fullNumber);
  };

  const selectedCountry = countries.find(c => c.code === countryCode) || countries[0];

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        Telefone {required && "*"} 
        <span className="text-sm text-muted-foreground ml-1">
          (formato: WhatsApp com DDD)
        </span>
      </Label>
      <div className="flex gap-2">
        <Select value={countryCode} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-24" data-testid="select-country-code">
            <SelectValue>
              {selectedCountry.flag} +{selectedCountry.code}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.flag} +{country.code} {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          id={id}
          type="tel"
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          data-testid={dataTestId}
          className="flex-1"
        />
      </div>
      
      {/* Preview do número completo */}
      {phoneNumber && (
        <div className="text-sm text-muted-foreground">
          Número para WhatsApp: +{countryCode}{phoneNumber.replace(/\D/g, "")}
        </div>
      )}
    </div>
  );
}