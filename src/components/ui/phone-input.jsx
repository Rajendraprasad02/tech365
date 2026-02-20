"use client";
import { useState, forwardRef, useEffect } from "react";
import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js";
import { CircleFlag } from "react-circle-flags";
import { lookup } from "country-data-list";
import { cn } from "@/lib/utils";
import { GlobeIcon } from "lucide-react";

export { isValidPhoneNumber };

export const PhoneInput = forwardRef(
    (
        {
            className,
            onCountryChange,
            onChange,
            value,
            placeholder,
            defaultCountry,
            inline = false,
            ...props
        },
        ref
    ) => {
        const [countryData, setCountryData] = useState(undefined);
        const [displayFlag, setDisplayFlag] = useState("");
        const [hasInitialized, setHasInitialized] = useState(false);

        useEffect(() => {
            if (defaultCountry) {
                const newCountryData = lookup.countries({
                    alpha2: defaultCountry.toLowerCase(),
                })[0];
                setCountryData(newCountryData);
                setDisplayFlag(defaultCountry.toLowerCase());

                if (
                    !hasInitialized &&
                    newCountryData?.countryCallingCodes?.[0] &&
                    !value
                ) {
                    const syntheticEvent = {
                        target: {
                            value: newCountryData.countryCallingCodes[0],
                        },
                    };
                    onChange?.(syntheticEvent);
                    setHasInitialized(true);
                }
            }
        }, [defaultCountry, onChange, value, hasInitialized]);

        // Max national number length per country (digits after country code)
        const MAX_NATIONAL_DIGITS = {
            'IN': 10, 'US': 10, 'GB': 10, 'AE': 9, 'SA': 9, 'PK': 10, 'BD': 10,
            'CN': 11, 'JP': 10, 'DE': 11, 'FR': 9, 'AU': 9, 'IT': 10, 'ES': 9,
            'BR': 11, 'MX': 10, 'RU': 10, 'KR': 11, 'SG': 8, 'MY': 10,
            'ID': 12, 'TH': 9, 'PH': 10, 'QA': 8, 'KW': 8, 'BH': 8,
            'OM': 8, 'JO': 9, 'IQ': 10, 'EG': 10, 'NG': 10, 'KE': 9,
            'LK': 9, 'NP': 10, 'TR': 10, 'ZA': 9, 'CA': 10,
        };

        const handlePhoneChange = (e) => {
            let newValue = e.target.value;

            // Only allow digits, + and spaces
            newValue = newValue.replace(/[^\d+\s]/g, '');

            // Ensure the value starts with "+"
            if (!newValue.startsWith("+")) {
                if (newValue.startsWith("00")) {
                    newValue = "+" + newValue.slice(2);
                } else {
                    newValue = "+" + newValue;
                }
            }

            try {
                const parsed = parsePhoneNumber(newValue);

                if (parsed && parsed.country) {
                    const countryCode = parsed.country;
                    const maxDigits = MAX_NATIONAL_DIGITS[countryCode] || 15;
                    const nationalNumber = parsed.nationalNumber || '';

                    // Enforce max length — truncate if national number exceeds limit
                    if (nationalNumber.length > maxDigits) {
                        const truncatedNational = nationalNumber.slice(0, maxDigits);
                        newValue = '+' + parsed.countryCallingCode + truncatedNational;
                    }

                    // Re-parse with potentially truncated value
                    const finalParsed = parsePhoneNumber(newValue) || parsed;

                    setDisplayFlag("");
                    setTimeout(() => {
                        setDisplayFlag(countryCode.toLowerCase());
                    }, 0);

                    const countryInfo = lookup.countries({ alpha2: countryCode })[0];
                    setCountryData(countryInfo);
                    onCountryChange?.(countryInfo);

                    const syntheticEvent = {
                        ...e,
                        target: {
                            ...e.target,
                            value: '+' + (finalParsed.countryCallingCode || parsed.countryCallingCode) + (finalParsed.nationalNumber || nationalNumber).slice(0, maxDigits),
                        },
                    };
                    onChange?.(syntheticEvent);
                } else {
                    // No country detected yet — allow typing but cap at 15 digits total
                    const digits = newValue.replace(/\D/g, '');
                    if (digits.length > 15) return;

                    onChange?.({ ...e, target: { ...e.target, value: newValue } });
                    setDisplayFlag("");
                    setCountryData(undefined);
                    onCountryChange?.(undefined);
                }
            } catch (error) {
                // Allow typing for partial numbers but cap at 15 digits
                const digits = newValue.replace(/\D/g, '');
                if (digits.length > 15) return;

                onChange?.({ ...e, target: { ...e.target, value: newValue } });
                setDisplayFlag("");
                setCountryData(undefined);
                onCountryChange?.(undefined);
            }
        };

        const inputClasses = cn(
            "flex items-center gap-2 relative bg-transparent transition-colors text-base rounded-md border border-input pl-3 h-9 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed md:text-sm has-[input:focus]:outline-none has-[input:focus]:ring-1 has-[input:focus]:ring-ring [interpolate-size:allow-keywords]",
            inline && "rounded-l-none w-full",
            className
        );

        return (
            <div className={inputClasses}>
                {!inline && (
                    <div className="w-4 h-4 rounded-full shrink-0">
                        {displayFlag ? (
                            <CircleFlag countryCode={displayFlag} height={16} />
                        ) : (
                            <GlobeIcon size={16} />
                        )}
                    </div>
                )}
                <input
                    ref={ref}
                    value={value}
                    onChange={handlePhoneChange}
                    placeholder={placeholder || "Enter number"}
                    type="tel"
                    autoComplete="tel"
                    name="phone"
                    className={cn(
                        "flex w-full border-none bg-transparent text-base transition-colors placeholder:text-muted-foreground outline-none h-9 py-1 p-0 leading-none md:text-sm [interpolate-size:allow-keywords]",
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);

PhoneInput.displayName = "PhoneInput";
