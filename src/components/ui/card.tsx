import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl text-card-foreground shadow-2xl transition-all duration-300 hover:border-white/10",
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-8", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.ComponentPropsWithoutRef<"h3">
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-bold leading-none text-white",
            className
        )}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-white/50 font-medium", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-8 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-8 pt-0", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
