export const truncate = (str: string, maxWidth: number) => {
   if (str.length < maxWidth - 3) {
      return str
   }
   return str.substring(0, maxWidth - 3) + "..."
}