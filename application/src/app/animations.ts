import { trigger, state, transition, style, animate, stagger, animateChild, query, animation, useAnimation } from '@angular/animations';


export let fadeInAnimation = animation([
  style({ opacity: 0 }),
  animate('{{ duration }} {{ easing }}')
], {
  params: {
    duration: '1s',
    easing: 'ease-out'
  }
});

export let fadeOutAnimation = animation([
  style({ opacity: 1 }),
  animate('{{ duration }} {{ easing }}')
], {
  params: {
    duration: '1s',
    easing: 'ease-in'
  }
});

export let fade = trigger('fade', [

  transition(':enter', 
    useAnimation(fadeInAnimation)
  ),

  transition(':leave', [ 
    animate(2000, style({ opacity: 0 }))
  ])
]);