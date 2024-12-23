import * as errors from "~util/errors"

export const requireFloat = (value: any, ...args) => {
    if (isNaN(parseFloat(value))) {
        throw new errors.ValidationError(`Invalid decimal value`)
    }
}

export const requireInteger = (value: any, ...args) => {
    if (isNaN(parseInt(value))) {
        throw new errors.ValidationError(`Invalid integer value`)
    }
}

export const requireNumberBetween = (value: number, min: number, max: number, ...args) => {
    if (value < min) {
        throw new errors.ValidationError(`Value cannot be less than ${min}`)
    } else if (value > max) {
        throw new errors.ValidationError(`Value cannot be greater than ${max}`)
    }
}

export const requireUnique = (value: any, array: any[], ...args) => {
    if (array.includes(value)) {
        throw new errors.ValidationError(`${value} already exists`)
    }
}

export const requireValue = (value: any, ...args) => {
    if (String(value).trim().length === 0) {
        throw new errors.ValidationError("Field cannot be empty")
    }
}
