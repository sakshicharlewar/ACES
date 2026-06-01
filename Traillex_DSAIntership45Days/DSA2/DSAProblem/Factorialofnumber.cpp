#include<iostream>
using namespace std;

int main()
{
    int i,factorial=1;
    cout<<"enter the number";
    cin>>i;
    for(int a=1; a<=i; a++)
    {
        factorial*=a;
    }
    cout<<factorial<<endl;
return 0;
}
