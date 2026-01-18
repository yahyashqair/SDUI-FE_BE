export const SNIPPETS = {
    Container: `{
  "type": "Container",
  "children": [],
  "padding": "1rem",
  "gap": "1rem"
}`,
    Text: `{
  "type": "Text",
  "content": "Hello World",
  "variant": "p"
}`,
    Button: `{
  "type": "Button",
  "label": "Click Me",
  "variant": "primary"
}`,
    Card: `{
  "type": "Card",
  "children": [
    { 
      "type": "Text", 
      "content": "Card Title", 
      "variant": "h3" 
    }
  ],
  "padding": "1.5rem"
}`,
    List: `{
  "type": "List",
  "items": [],
  "variant": "bulleted"
}`,
    Badge: `{
  "type": "Badge",
  "label": "New",
  "variant": "success"
}`,
    Image: `{
  "type": "Image",
  "src": "https://via.placeholder.com/150",
  "alt": "Placeholder",
  "width": "100%"
}`,
    Charts_Mock: `{
  "type": "Container",
  "children": [
    {
      "type": "Text",
      "content": "Revenue Growth",
      "variant": "h4"
    },
    {
        "type": "Container",
        "direction": "row",
        "align": "end",
        "justify": "space-between",
        "style": { "height": "100px", "marginTop": "1rem" },
        "children": [
            { "type": "Container", "style": { "background": "#6366f1", "width": "20px", "height": "40%" } },
            { "type": "Container", "style": { "background": "#6366f1", "width": "20px", "height": "70%" } },
            { "type": "Container", "style": { "background": "#6366f1", "width": "20px", "height": "50%" } },
            { "type": "Container", "style": { "background": "#6366f1", "width": "20px", "height": "90%" } }
        ]
    }
  ],
  "padding": "1rem",
  "style": { "border": "1px solid #e5e7eb", "borderRadius": "8px" }
}`
};
