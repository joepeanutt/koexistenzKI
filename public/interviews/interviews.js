// Interviews Page Script

document.addEventListener('DOMContentLoaded', () => {
  const interviews = [
    {
      name: 'Dr. KI Expert',
      title: 'KI-Forscher/in',
      text: 'Künstliche Intelligenz wird die Gesellschaft grundlegend verändern. Wir müssen ethische Leitplanken setzen.'
    },
    {
      name: 'Lehrerin Müller',
      title: 'Lehrerin',
      text: 'KI kann den Unterricht bereichern, aber der persönliche Kontakt bleibt unersetzlich.'
    },
    {
      name: 'Schüler Jonas',
      title: 'Schüler',
      text: 'Ich finde KI spannend, aber manchmal auch beängstigend. Es kommt darauf an, wie wir sie nutzen.'
    }
  ];

  const list = document.getElementById('interview-list');
  if (list) {
    interviews.forEach(intv => {
      const div = document.createElement('div');
      div.className = 'interview-item';
      div.innerHTML = `<h4>${intv.name} <span style="font-size:0.95em;color:#888;">(${intv.title})</span></h4><p>${intv.text}</p>`;
      list.appendChild(div);
    });
  }
});
