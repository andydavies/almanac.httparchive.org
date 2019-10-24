const { JSDOM } = require('jsdom');

const generate_table_of_contents = (html) => {
  const dom = new JSDOM(html);
  const all_headings = Object.values(
    dom.window.document.querySelectorAll('h1, h2, h3, h4, h5, h6')
  );
  const starting_level = get_level(all_headings[0]);
  const nested_headings = nest_headings(all_headings, starting_level);
  console.log(JSON.stringify(nested_headings));
  const toc = generate_html(nested_headings.children);

  return toc;
};

const generate_html = (headings) => {
  const list = [];
  for (const heading of headings) {
    const a = `<a href="#${heading.id}">${heading.title}</a>`;
    const children = heading.children ? generate_html(heading.children) : '';
    const li = `<li>${a}${children}</li>`;
    list.push(li);
  }

  return `<ul>${list.join('')}</ul>`;
};

// This is a recursive function to nest the headings.
const nest_headings = (source, current_level = 1) => {
  // The list of headings to output.
  let target = [];

  while (source.length) {
    // Pull the first item off of the source list.
    const element = source.shift();
    const id = element.id;
    const title = element.textContent;
    const level = get_level(element);

    const heading = {
      id,
      level,
      title
    };

    if (level === current_level) {
      // The heading is at this level, add it to the list.
      target.push(heading);
    } else if (level > current_level) {
      /* The heading needs to be added to the next level.
        - Get the last item on the list, that becomes the parent.
        - Use the rest of the source list to recurse and generate the 
          rest of the children.
        - Set the children property of the parent heading, including
            * Previous children
            * The 'current' heading)
            * The recursively generated children
      */

      const parent = target[target.length - 1];
      let { children, nextHeading } = nest_headings(source, level);
      parent.children = [...(parent.children || []), heading, ...children];
      if (nextHeading) {
        target.push(nextHeading);
      }
    } else {
      /* The next item on the source is at a higher level, break out of this
         level of recursion.
      */

      return { children: target, nextHeading: heading };
    }
  }

  return { children: target };
};

const get_level = (element) => Number(element.localName.match(/\d+/)[0]);

module.exports = {
  generate_table_of_contents
};