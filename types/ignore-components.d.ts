// Type declarations to ignore type errors in external component libraries
declare module "@/components/ui/*" {
  const Component: any;
  export = Component;
  export default Component;
}

declare module "@/components/ai-elements/*" {
  const Component: any;
  export = Component;
  export default Component;
}
