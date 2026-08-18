import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { InquiryModalComponent } from '../../components/modals/inquiry-modal/inquiry-modal.component';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent, InquiryModalComponent, CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  isLoading = true;
  showInquiry = false;
  selectedServiceDetails: any | null = null;
  preselectedInquiryType = 'Other';
  
  private observer: IntersectionObserver | null = null;
  private carouselInterval: any = null;
  private isCarouselPaused = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('openInquiry') === 'true') {
      if (this.authService.isLoggedIn()) {
        const type = this.route.snapshot.queryParamMap.get('type');
        if (type) {
          this.preselectedInquiryType = type;
        }
        this.showInquiry = true;
      }
    }

    // Simulate loading for premium SPA feel
    setTimeout(() => {
      this.isLoading = false;
      // Allow Angular DOM compilation cycle to finish
      setTimeout(() => {
        this.initObservers();
      }, 50);
    }, 850);
  }

  showServiceDetails(serviceName: string): void {
    const details: Record<string, { title: string, subtitle: string, desc: string, inclusions: string[], icon: string, inquiryType: string }> = {
      'Buy & Install': {
        title: 'Buy & Install Service',
        subtitle: 'Expert AC purchase with professional installation included',
        desc: 'Get a seamless cooling experience from day one. Select from our range of energy-efficient, premium AC brands and have them installed by certified AirLux professionals at your convenience.',
        inclusions: [
          'Selection assistance for premium AC brands',
          'Professional delivery & safety check',
          'Full installation by certified AirLux technicians',
          '1-year standard warranty on installation craftsmanship',
          'Complimentary first-month operational audit'
        ],
        icon: 'cart',
        inquiryType: 'Product'
      },
      'Installation Only': {
        title: 'Professional Installation Only',
        subtitle: 'Secure and expert setup for your existing AC units',
        desc: 'Already have an AC unit? Avoid layout or wiring issues by scheduling our certified technicians. We ensure optimal placement, correct ducting, and strict pressure tests for leak-free cooling.',
        inclusions: [
          'Unit inspection and compatibility check',
          'Premium mount brackets and raw materials',
          'Precise outdoor and indoor unit positioning',
          'Vacuum pressure testing & gas level checks',
          'Demonstration and usage optimization briefing'
        ],
        icon: 'wrench',
        inquiryType: 'Installation'
      },
      'Repair & Service': {
        title: 'Fast Repair & Maintenance Service',
        subtitle: 'Rapid troubleshooting and restoration for all AC brands',
        desc: 'Is your AC leaking, blowing warm air, or making noise? Our diagnostic experts are dispatched immediately to identify problems, replace faulty parts with genuine spares, and restore full airflow.',
        inclusions: [
          'Comprehensive system troubleshooting & diagnostics',
          'Genuine spare parts replacement with warranty',
          'Filter cleaning & coil inspection',
          'Refrigerant gas recharging and leak sealing',
          'Post-repair cooling performance check'
        ],
        icon: 'gear',
        inquiryType: 'Other'
      },
      'Annual Maintenance': {
        title: 'Annual Maintenance Contract (AMC)',
        subtitle: 'Proactive protection plans for peak efficiency all year round',
        desc: 'Keep your cooling systems at peak performance while reducing electricity bills. Our AMC contracts offer planned routine checkups, breakdown priorities, and filter changes.',
        inclusions: [
          '3 scheduled maintenance visits per year',
          'Priority booking & zero service call fees during breakdowns',
          'Deep condenser and evaporator coil chemical wash',
          'Electrical wiring and sensor checks',
          'Detailed log reporting in your customer dashboard'
        ],
        icon: 'shield',
        inquiryType: 'AMC'
      }
    };

    this.selectedServiceDetails = details[serviceName] || null;
  }

  closeServiceDetails(): void {
    this.selectedServiceDetails = null;
  }

  bookServiceInquiry(inquiryType: string): void {
    this.closeServiceDetails();
    this.preselectedInquiryType = inquiryType;
    if (this.authService.isLoggedIn()) {
      this.showInquiry = true;
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/?openInquiry=true&type=${inquiryType}` },
      });
    }
  }

  scrollToServices(): void {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('services');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  ngAfterViewInit(): void {
    if (!this.isLoading) {
      this.initObservers();
    }
  }

  initObservers(): void {
    if (this.observer) return; // Prevent duplicate observer bindings

    // Scroll reveal observer
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // If the stats strip became visible, trigger counter animation
            if (entry.target.classList.contains('stats-strip')) {
              this.animateCounters();
            }
            
            this.observer?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05 });

      const targets = document.querySelectorAll('.animate-on-scroll');
      targets.forEach(t => this.observer?.observe(t));
    }

    // Auto-advancing mobile carousel
    if (typeof window !== 'undefined') {
      this.initMobileCarousel();
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  animateCounters(): void {
    const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const counters = document.querySelectorAll('.stat-num[data-count]');
    
    counters.forEach(counter => {
      const target = +counter.getAttribute('data-count')!;
      
      if (isReduced) {
        // Accessibility override: instantly display target count
        counter.textContent = target + '+';
        return;
      }

      let count = 0;
      const duration = 1500; // 1.5s
      const steps = 50;
      const stepValue = target / steps;
      const stepTime = duration / steps;
      
      const timer = setInterval(() => {
        count += stepValue;
        if (count >= target) {
          counter.textContent = target + '+';
          clearInterval(timer);
        } else {
          counter.textContent = Math.floor(count) + '+';
        }
      }, stepTime);
    });
  }

  initMobileCarousel(): void {
    const carousel = document.querySelector('.review-cards') as HTMLElement;
    if (!carousel) return;

    // Detect touch to pause auto-advancing
    carousel.addEventListener('touchstart', () => this.isCarouselPaused = true, { passive: true });
    carousel.addEventListener('touchend', () => {
      // Resume auto-advance after 5 seconds of inactivity
      setTimeout(() => this.isCarouselPaused = false, 5000);
    }, { passive: true });

    this.carouselInterval = setInterval(() => {
      // Only run on mobile (width <= 768px) and when not paused
      if (window.innerWidth > 768 || this.isCarouselPaused) return;

      const cards = carousel.querySelectorAll('.review-card');
      if (cards.length === 0) return;

      const cardWidth = cards[0].clientWidth + 16; // width + gap
      const currentScroll = carousel.scrollLeft;
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;

      // Scroll to next slide or wrap back to start
      if (currentScroll >= maxScroll - 5) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        carousel.scrollTo({ left: currentScroll + cardWidth, behavior: 'smooth' });
      }
    }, 4000);
  }

  handleInquiryClick(): void {
    if (this.authService.isLoggedIn()) {
      this.showInquiry = true;
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/?openInquiry=true' },
      });
    }
  }
}
