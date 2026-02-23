import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { InquiryModalComponent } from '../../components/inquiry-modal/inquiry-modal.component';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent, InquiryModalComponent, CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit {
  showInquiry = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('openInquiry') === 'true') {
      if (this.authService.isLoggedIn()) {
        this.showInquiry = true;
      }
    }
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
